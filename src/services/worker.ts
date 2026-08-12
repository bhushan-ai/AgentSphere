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
import { embeddings, qdrantClient, storeToDb } from "./qdrant/connection";
import { unlink } from "fs/promises";
import crypto, { randomUUID } from "crypto";

// Create a worker for the document queue
const documentWorker = new Worker(
  "document",
  async (job) => {
    console.log("Processing job data");
    const { documentId } = job.data;
    console.log("📄 Processing job:", job.id);
    console.log("📦 Data:", job.data);
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

      if (!response.Body) {
        throw new Error("S3 returned an empty body reference");
      }

      // write the file in temporary path
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
      const documentType = document.fileName.split(".").pop()?.toLowerCase();

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
        chunkSize: 800,
        chunkOverlap: 50,
      });

      // Chunk
      const chunk = await splitter.splitDocuments(docs);

      // Remove empty strings, control symbols, and excessive spacing bugs
      const sanitizedChunks = chunk
        .map((doc) => {
          const cleanText = doc.pageContent
            .replace(/[\x00-\x1F\x7F-\x9F]/g, "") // Strip invisible control characters
            .replace(/\s+/g, " ") // Normalize messy whitespaces
            .trim();

          return { ...doc, pageContent: cleanText };
        })
        .filter((doc) => doc.pageContent.length > 5); // Evict any completely vacuous chunks

      if (sanitizedChunks.length === 0) {
        throw new Error(
          "Aborting: No embeddable raw text remains after document sanitization processing.",
        );
      }
      // attach meta data
      const chunksWithMetadata = sanitizedChunks.map((doc) => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          documentId: document.id,
          knowledgeBaseId: document.knowledgeBasedCollectionId,
          fileName: document.fileName,
        },
      }));

      //storing to db
      console.log(
        `Generating embeddings and uploading ${chunksWithMetadata.length} chunks to qdrant`,
      );

      const BATCH_SIZE = 10;
      
      for (let i = 0; i < chunksWithMetadata.length; i += BATCH_SIZE) {
        const currentBatch = chunksWithMetadata.slice(i, i + BATCH_SIZE);
        console.log(
          `📡 Processing subset batch: chunks ${i} to ${Math.min(i + BATCH_SIZE, chunksWithMetadata.length)}...`,
        );

        // Pass the safe sub-batch slice cleanly down to Langchain
        await storeToDb(currentBatch);

        // Introduce a minor delay (e.g. 500ms) to allow the API limits window to settle down smoothly
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      console.log(" Successfully saved vectors to Qdrant!");

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
