import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { randomUUID } from "crypto";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireWorkspaceRole } from "../middleware/checkRole";
import { s3Client } from "../services/aws/s3";

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
