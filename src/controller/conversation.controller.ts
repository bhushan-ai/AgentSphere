import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireWorkspaceRole } from "../middleware/checkRole";

//create conversation
export const createConversation = async (req: Request, res: Response) => {
  try {
    const { agentId, title } = req.body;

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!agentId || !title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "AgentId and title are required",
      });
    }

    //find agent exist or not
    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId,
      },
    });

    if (!agent) {
      return res
        .status(404)
        .json({ success: false, message: "agent not found" });
    }

    //check the role
    await requireWorkspaceRole(agent.workspaceId, userId as string, [
      "ADMIN",
      "OWNER",
      "MEMBER",
    ]);

    const conversation = await prisma.conversation.create({
      data: {
        title: title,
        createdBy: userId,
        agentId: agentId,
      },
    });

    if (!conversation) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to create conversation" });
    }

    return res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      data: conversation,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`Something went wrong while creating conversation`, err);
    res
      .status(500)
      .json({ success: false, message: "Server side error", error: err });
  }
};

//get conversation by Id
export const getConversationById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const conversationId = req.params.conversationId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!conversationId) {
      return res
        .status(400)
        .json({ success: false, message: "conversationId is required" });
    }

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
      return res
        .status(404)
        .json({ success: false, message: "Failed to get conversation" });
    }

    //check the role
    await requireWorkspaceRole(
      conversation.agent.workspaceId,
      userId as string,
      ["ADMIN", "OWNER", "MEMBER"],
    );

    return res.status(200).json({
      success: true,
      message: "Conversation fetched successfully",
      data: conversation,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`Something went wrong while fetching conversation`, err);
    res
      .status(500)
      .json({ success: false, message: "Server side error", error: err });
  }
};

// get all conversations
export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const agentId = req.params.agentId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!agentId) {
      return res
        .status(400)
        .json({ success: false, message: "agentId and title are required" });
    }

    //find agent exist or not
    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId as string,
      },
    });

    if (!agent) {
      return res
        .status(404)
        .json({ success: false, message: "agent not found" });
    }

    //check the role
    await requireWorkspaceRole(agent.workspaceId, userId as string, [
      "ADMIN",
      "OWNER",
      "MEMBER",
    ]);

    const conversations = await prisma.conversation.findMany({
      where: {
        agentId: agentId as string,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Conversations fetched successfully",
      data: conversations,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`Something went wrong while fetching conversations`, err);
    res
      .status(500)
      .json({ success: false, message: "Server side error", error: err });
  }
};

// delete conversation
export const deleteConversation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const conversationId = req.params.conversationId;

    if (!conversationId) {
      return res
        .status(400)
        .json({ success: false, message: "conversationId is required" });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

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
      return res
        .status(404)
        .json({ success: false, message: "Failed to get conversation" });
    }

    //check the role
    await requireWorkspaceRole(
      conversation.agent.workspaceId,
      userId as string,
      ["ADMIN", "OWNER", "MEMBER"],
    );

    //only creator can delete it
    if (conversation.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the creator can delete this conversation",
      });
    }

    await prisma.conversation.delete({
      where: {
        id: conversationId as string,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`Something went wrong while deleting conversations`, err);
    res
      .status(500)
      .json({ success: false, message: "Server side error", error: err });
  }
};
