import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { randomUUID } from "crypto";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireWorkspaceRole } from "../middleware/checkRole";
import { s3Client } from "../services/aws/s3";
import { documentQueue } from "../services/queue";

//create presigned url
export const createPreSignedUrl = async (req: Request, res: Response) => {
  try {
    const { filename, contentType } = req.body;
    const userId = req.user?.id;

    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported file type",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!filename?.trim() || !contentType?.trim()) {
      return res.status(400).json({
        success: false,
        message: "filename and contentType are required",
      });
    }

    const key = `uploads/${randomUUID}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: 900,
    });

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    res.status(201).json({
      success: true,
      message: "Pre-signed upload URL generated",
      uploadUrl: url,
      key,
      fileUrl,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`Something went wrong while uploading the file`, err);
    res
      .status(500)
      .json({ success: false, message: "Server side error", error: err });
  }
};

// create document
export const createDocument = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { fileName, fileSize, fileUrl } = req.body;
    const knowledgeBaseId = req.params.knowledgeBaseId;
    const userId = req.user?.id;

    if (!fileName?.trim() || fileSize == null || !fileUrl?.trim()) {
      res.status(400).json({
        success: false,
        message: "All fields are required",
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    if (!knowledgeBaseId) {
      res.status(401).json({
        success: false,
        message: "knowledgeBaseId required ",
      });
      return;
    }

    //check knowledge base exist
    const knowledgeBaseCollection =
      await prisma.knowledgeBasedCollection.findUnique({
        where: {
          id: knowledgeBaseId as string,
        },
        include: {
          agent: {
            select: {
              workspaceId: true,
            },
          },
        },
      });

    if (!knowledgeBaseCollection) {
      res.status(404).json({
        success: false,
        message: "knowledgeBaseCollection not found ",
      });
      return;
    }

    await requireWorkspaceRole(
      knowledgeBaseCollection?.agent.workspaceId,
      userId,
      ["OWNER", "ADMIN", "MEMBER"],
    );

    const document = await prisma.document.create({
      data: {
        fileName: fileName,
        fileSize: fileSize,
        fileUrl: fileUrl,
        status: "PENDING",
        knowledgeBase: {
          connect: {
            id: knowledgeBaseId as string,
          },
        },
      },
    });

    //add to queue
    await documentQueue.add(
      "new-doc",
      {
        documentId: document.id,
      },
      {
        removeOnComplete: true,
      },
    );

    res.status(201).json({
      success: true,
      message: "Document created successfully",
      data: document,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`Something went wrong while creating the document`, err);
    res.status(500).json({
      success: false,
      message: "Server side error",
      error: err.message,
    });
  }
};
