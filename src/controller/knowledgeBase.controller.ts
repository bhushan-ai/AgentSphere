import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { randomUUID } from "crypto";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireWorkspaceRole } from "../middleware/checkRole";
import { s3Client } from "../services/aws/s3";
import { documentQueue } from "../services/queue";
import { qdrantClient } from "../services/qdrant/connection";

//create knowledgeBase
export const knowledgeBaseCollection = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    const agentId = req.params.agentId;
    const userId = req.user?.id;

    if (!title?.trim()) {
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

    if (!agentId) {
      res.status(400).json({
        success: false,
        message: "agentId required ",
      });
      return;
    }

    //check agent exist or not
    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId as string,
      },
    });

    if (!agent) {
      res.status(404).json({
        success: false,
        message: "Agent not found",
      });
      return;
    }

    //check role of user
    await requireWorkspaceRole(agent.workspaceId, userId, ["OWNER", "ADMIN"]);

    const knowledgeBaseCollection =
      await prisma.knowledgeBasedCollection.create({
        data: {
          title,
          agentId: agentId as string,
          createdBy: userId,
        },
      });

    res.status(201).json({
      success: true,
      message: "knowledgeBaseCollection created successfully",
      data: knowledgeBaseCollection,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`Something went wrong while creating the knowledgeBase`, err);
    res.status(500).json({
      success: false,
      message: "Server side error",
      error: err.message,
    });
  }
};

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

    const key = `uploads/${randomUUID()}-${filename}`;

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
    const { fileName, fileSize, fileUrl, key } = req.body;
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
        key: key,
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
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
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

//get docs
export const getDocuments = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const knowledgeBaseId = req.params.knowledgeBaseId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!knowledgeBaseId) {
      res
        .status(400)
        .json({ success: false, message: "knowledgeBaseId is required" });
      return;
    }

    //check knowledgeBase collection exist or not
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

    const documents = await prisma.document.findMany({
      where: {
        knowledgeBasedCollectionId: knowledgeBaseId as string,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      message: "Documents fetched successfully",
      data: documents,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`Something went wrong while getting the documents`, err);
    res.status(500).json({
      success: false,
      message: "Server side error",
      error: err.message,
    });
  }
};

//del doc
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const documentId = req.params.documentId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!documentId) {
      res.status(400).json({
        success: false,
        message: "documentId is required",
      });
      return;
    }

    //check doc exit or not
    const document = await prisma.document.findUnique({
      where: {
        id: documentId as string,
      },
      include: {
        knowledgeBase: {
          include: {
            agent: {
              select: {
                workspaceId: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      res.status(404).json({
        success: false,
        message: "Document not found",
      });
      return;
    }

    if (!document.knowledgeBase) {
      res.status(500).json({
        success: false,
        message: "Document knowledge base not found",
      });
      return;
    }

    //check role
    await requireWorkspaceRole(
      document.knowledgeBase.agent.workspaceId,
      userId,
      ["OWNER", "ADMIN", "MEMBER"],
    );

    //deleting doc from qdrant
    await qdrantClient.delete("agent-sphere", {
      wait:true,
      filter: {
        must: [
          {
            key: "metadata.documentId",
            match: {
              value: documentId,
            },
          },
        ],
      },
    });

    //deleting from aws
    const cmd = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: document.key,
    });

    await s3Client.send(cmd);

    //deleting from postgres
    await prisma.document.delete({
      where: {
        id: documentId as string,
      },
    });

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`Something went wrong while deleting the document`, err);
    res.status(500).json({
      success: false,
      message: "Server side error",
      error: err.message,
    });
  }
};
