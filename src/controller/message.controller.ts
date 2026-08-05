import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireWorkspaceRole } from "../middleware/checkRole";

//send message
export const sendMessage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { content } = req.body;
    const userId = req.user?.id;
    const conversationId = req.params.conversationId;

    if (!content?.trim()) {
      res.status(400).json({
        success: false,
        message: "Content is required",
      });
      return;
    }

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!conversationId) {
      res
        .status(400)
        .json({ success: false, message: "conversationId is required" });
      return;
    }

    //check conversation exist or not
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId as string,
      },
      include: {
        agent: {
          select: {
            workspaceId: true,
          },
        },
      },
    });

    if (!conversation) {
      res
        .status(404)
        .json({ success: false, message: "Failed to get conversation" });
      return;
    }

    await requireWorkspaceRole(conversation.agent.workspaceId, userId, [
      "OWNER",
      "ADMIN",
      "MEMBER",
    ]);

    const message = await prisma.message.create({
      data: {
        conversationId: conversationId as string,
        content: content.trim(),
        senderId: userId,
        role: "USER",
      },
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`Something went wrong while sending message`, err);
    res
      .status(500)
      .json({ success: false, message: "Server side error", error: err });
  }
};

//get message
export const getMessages = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const conversationId = req.params.conversationId;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!conversationId) {
      res
        .status(400)
        .json({ success: false, message: "conversationId is required" });
      return;
    }

    //check conversation exist or not
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId as string,
      },
      include: {
        agent: {
          select: {
            workspaceId: true,
          },
        },
      },
    });

    if (!conversation) {
      res
        .status(404)
        .json({ success: false, message: "Failed to get conversation" });
      return;
    }

    await requireWorkspaceRole(conversation.agent.workspaceId, userId, [
      "OWNER",
      "ADMIN",
      "MEMBER",
    ]);

    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversationId as string,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    res.status(200).json({
      success: true,
      message: "Messages fetched Successfully",
      data: messages,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`Something went wrong while getting message`, err);
    res
      .status(500)
      .json({ success: false, message: "Server side error", error: err });
  }
};

//delete message
export const deleteMessage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const messageId = req.params.messageId;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!messageId) {
      res
        .status(400)
        .json({ success: false, message: "messageId is required" });
      return;
    }

    //check msg exist
    const message = await prisma.message.findUnique({
      where: {
        id: messageId as string,
      },
      include: {
        conversation: {
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

    if (!message) {
      res
        .status(404)
        .json({ success: false, message: "Failed to get message" });
      return;
    }

    const member = await requireWorkspaceRole(
      message.conversation.agent.workspaceId,
      userId,
      ["OWNER", "ADMIN", "MEMBER"],
    );

    if (message.senderId !== userId && member.role === "MEMBER") {
      res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      });
      return;
    }

    await prisma.message.delete({
      where: {
        id: messageId as string,
      },
    });

    res.status(200).json({
      success: true,
      message: "Messages deleted Successfully",
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`Something went wrong while deleting message`, err);
    res
      .status(500)
      .json({ success: false, message: "Server side error", error: err });
  }
};
