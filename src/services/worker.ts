import { tryCatch, Worker } from "bullmq";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { prisma } from "../lib/prisma";
import { connection } from "./queue";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./aws/s3";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { pipeline } from "stream/promises";
import path from "path";
import { vectorStore } from "./qdrant/connection";
import { unlink } from "fs/promises";

// Create a worker for the document queue
const documentWorker = new Worker(
  "document",
  async (job) => {
    console.log("Processing job data");
    const { documentId } = job.data;
    let tempPath;
    try {
      const document = await prisma.document.findUnique({
        where: {
          id: documentId,
        },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      //update the status to PROCESSING
      await prisma.document.update({
        where: {
          id: documentId,
        },
        data: {
          status: "PROCESSING",
        },
      });

      // Download from S3
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: document.key,
      });

      const response = await s3Client.send(command);

      //write the file in temporary path
      const tempDir = path.join(process.cwd(), "temp");
      await mkdir(tempDir, {
        recursive: true,
      });

      tempPath = path.join(tempDir, document.fileName);
      if (!response.Body) {
        throw new Error("S3 returned an empty body");
      }

      await pipeline(
        response.Body as NodeJS.ReadableStream,
        createWriteStream(tempPath),
      );

      // Extract text
      let docs;
      const documentType = document.fileName
        .split(".")
        .pop()
        ?.toLocaleLowerCase();

      switch (documentType) {
        case "pdf":
          //pdf loader
          docs = await new PDFLoader(tempPath).load();
          break;
        case "txt":
          //text loader
          docs = await new TextLoader(tempPath).load();
          break;
        case "docx":
          //doc loader
          docs = await new DocxLoader(tempPath).load();
          break;
        default:
          throw new Error("Unsupported file type");
      }

      // text splitter
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 50,
      });

      // Chunk
      const chunk = await splitter.splitDocuments(docs);

      // attach meta data
      const chunksWithMetadata = chunk.map((doc) => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          documentId: document.id,
          knowledgeBaseId: document.knowledgeBasedCollectionId,
        },
      }));

      //storing to db
      await vectorStore.addDocuments(chunksWithMetadata);

      //update the status to READY
      await prisma.document.update({
        where: {
          id: documentId,
        },
        data: {
          status: "READY",
        },
      });
    } catch (error) {
      await prisma.document.update({
        where: {
          id: documentId,
        },
        data: {
          status: "FAILED",
        },
      });
      throw error;
    } finally {
      if (tempPath) {
        try {
          await unlink(tempPath);
        } catch (error) {
          console.error("Failed to delete temp file", error);
        }
      }
    }
  },
  { connection },
);

documentWorker.on("completed", (job) => {
  console.log(`Job with id:${job.id} has been completed`);
});

documentWorker.on("failed", (job, err) => {
  console.log(`Job with id ${job?.id} has failed with error: ${err.message}`);
});
