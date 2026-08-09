import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireWorkspaceRole } from "../middleware/checkRole";
import { QdrantVectorStore } from "@langchain/qdrant";
import { ai, embeddings, qdrantClient } from "../services/qdrant/connection";

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
            id: true,
            workspaceId: true,
            type: true,
            systemPrompt: true,
            model: true,
            provider: true,
            temperature: true,
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

    const agent = conversation.agent;

    let context = "";
    const history = await prisma.message.findMany({
      where: {
        conversationId: conversation.id,
        id: {
          not: message.id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    const formattedHistory = history.reverse()
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    //BY checking type of agent sending responses
    if (agent.type === "CONVERSATIONAL") {
      context = `Conversation History: ${formattedHistory}`;
    }

    if (agent.type === "KNOWLEDGE_BASE") {
      // history → question → embedding → Qdrant → context → LLM
      const knowledgeBase = await prisma.knowledgeBasedCollection.findFirst({
        where: {
          agentId: conversation.agentId,
        },
      });

      if (!knowledgeBase) {
        throw new Error("Knowledge base not found");
      }

      //retrieve from qdrant
      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          client: qdrantClient,
          collectionName: "agent-sphere",
        },
      );

      const vectorSearcher = vectorStore.asRetriever({
        k: 3,
        filter: {
          must: [
            {
              key: "metadata.knowledgeBaseId",
              match: {
                value: knowledgeBase.id,
              },
            },
          ],
        },
      });

      const relevantChunks = await vectorSearcher.invoke(message.content);

      const contextFromChunks = relevantChunks
        .map((doc) => {
          return ` 
        Sources: ${doc.metadata.fileName ?? "unknown"}
        Page: ${doc.metadata.loc?.pageNumber ?? "N/M"}
        Content:
          ${doc.pageContent}`;
        })
        .join("\n\n");

      context = `
        Use the following retrieved context to answer the user's question.
         Context: ${contextFromChunks}
         Conversation History: ${formattedHistory}
        `;
    }

    const prompt = `${context}

  Current Question:
  ${message.content}
    `;

    // //llm integration
    const responseStream = await ai.models.generateContentStream({
      model: agent.model,
      config: {
        systemInstruction: agent.systemPrompt,
        temperature: agent.temperature,
      },

      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${prompt} `,
            },
          ],
        },
      ],
    });

    let assistantContent = "";

    res.status(200);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");

    for await (const chunks of responseStream) {
      const text = chunks.text;
      if (text) {
        assistantContent += text;
        res.write(text);
      }
    }

    await prisma.message.create({
      data: {
        conversationId: conversationId as string,
        content: assistantContent,
        role: "ASSISTANT",
      },
    });

    res.end();
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
