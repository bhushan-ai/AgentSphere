import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireWorkspaceRole } from "../middleware/checkRole";

//get all agents in a workspace
export const getAgents = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.params.workspaceId;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!workspaceId) {
      res.status(400).json({ message: "Missing workspaceId" });
      return;
    }

    // Check if the user is an admin or owner of the workspace
    await requireWorkspaceRole(workspaceId as string, userId, [
      "OWNER",
      "ADMIN",
      "MEMBER",
    ]);

    const agents = await prisma.agent.findMany({
      where: {
        workspaceId: workspaceId as string,
      },
      select: {
        id: true,
        name: true,
        provider: true,
        model: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Agents fetched successfully",
      data: agents,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`Something went wrong while fetching agents`, err);
    res
      .status(500)
      .json({ success: false, message: "Server side error", error: err });
  }
};

//get an agent by id
export const getAgentsById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const agentId = req.params.agentId;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!agentId) {
      res.status(400).json({ message: "Missing agentId" });
      return;
    }

    //check  agent  existence
    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId as string,
      },
      select: {
        id: true,
        name: true,
        description: true,
        workspaceId: true,
        model: true,
        provider: true,
        systemPrompt: true,
        temperature: true,
        createdAt: true,
      },
    });

    if (!agent) {
      res.status(404).json({ message: "Agent not found" });
      return;
    }

    // Check if the user is an admin or owner of the workspace
    await requireWorkspaceRole(agent.workspaceId as string, userId, [
      "OWNER",
      "ADMIN",
      "MEMBER",
    ]);

    res.status(200).json({
      success: true,
      message: "Agent fetched successfully",
      data: agent,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`Something went wrong while fetching agent`, err);
    res
      .status(500)
      .json({ success: false, message: "Server side error", error: err });
  }
};

//create an agent
export const createAgent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      name,
      description,
      model,
      provider,
      systemPrompt,
      temperature,
      type,
    } = req.body;

    const workspaceId = req.params.workspaceId;

    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (
      !name.trim() ||
      !description.trim() ||
      !model.trim() ||
      !provider ||
      !systemPrompt
    ) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Validate temperature
    if (temperature < 0 || temperature > 2) {
      res.status(400).json({
        message: "Invalid temperature value. Must be between 0 and 2.",
      });
      return;
    }

    // Validate Providers
    const validProviders = ["OPENAI", "GEMINI", "GROQ", "ANTHROPIC"];

    if (!validProviders.includes(provider)) {
      res.status(400).json({
        message:
          "Invalid provider value. Must be one of: OPENAI, GEMINI, GROQ, ANTHROPIC",
      });
      return;
    }

    if (!workspaceId) {
      res.status(400).json({ message: "Missing workspaceId" });
      return;
    }

    //check existing agent name
    const existingAgent = await prisma.agent.findFirst({
      where: {
        name: name,
        workspaceId: workspaceId as string,
      },
    });

    if (existingAgent) {
      res.status(400).json({
        message: "Agent with this name already exists in the workspace",
      });
    }

    // Check if the workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: {
        id: workspaceId as string,
      },
    });

    if (!workspace) {
      res.status(404).json({ message: "Workspace not found" });
      return;
    }

    // Check if the user is an admin or owner of the workspace
    await requireWorkspaceRole(workspaceId as string, userId, [
      "OWNER",
      "ADMIN",
    ]);

    //create agent
    const agent = await prisma.agent.create({
      data: {
        name,
        description,
        model,
        provider,
        systemPrompt,
        temperature,
        type,
        workspaceId: workspaceId as string,
      },
    });

    res.status(201).json({
      success: true,
      message: "Agent created successfully",
      data: agent,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`Something went wrong while creating agent`, err);
    res
      .status(500)
      .json({ success: false, message: "Server side error", error: err });
  }
};

//update an agent
export const updateAgent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      name,
      description,
      model,
      provider,
      systemPrompt,
      temperature,
      type,
    } = req.body;

    const userId = req.user?.id;
    const agentId = req.params.agentId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!agentId) {
      res.status(400).json({ message: "Missing agentId" });
      return;
    }

    if ((temperature !== undefined && temperature < 0) || temperature > 2) {
      res.status(400).json({
        message: "Invalid temperature value. Must be between 0 and 2.",
      });
      return;
    }

    // Validate Providers
    const validProviders = ["OPENAI", "GEMINI", "GROQ", "ANTHROPIC"];

    if (provider && !validProviders.includes(provider)) {
      res.status(400).json({
        message:
          "Invalid provider value. Must be one of: OPENAI, GEMINI, GROQ, ANTHROPIC",
      });
      return;
    }

    //check  agent  existence
    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId as string,
      },
    });

    if (!agent) {
      res.status(404).json({ message: "Agent not found" });
      return;
    }

    // Check if the user is an admin or owner of the workspace
    await requireWorkspaceRole(agent.workspaceId as string, userId, [
      "OWNER",
      "ADMIN",
    ]);

    const updatedAgent = await prisma.agent.update({
      where: {
        id: agentId as string,
      },
      data: {
        ...(name && { name: name?.trim() }),
        ...(description && { description: description?.trim() }),
        ...(model && { model }),
        ...(type && { type }),
        ...(provider && { provider }),
        ...(systemPrompt && { systemPrompt: systemPrompt?.trim() }),
        ...(temperature !== undefined && { temperature }),
      },
    });

    res.status(200).json({
      success: true,
      message: "Agent updated successfully",
      data: updatedAgent,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`Something went wrong while updating agent`, err);
    res
      .status(500)
      .json({ success: false, message: "Server side error", error: err });
  }
};

//delete an agent
export const deleteAgent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const agentId = req.params.agentId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!agentId) {
      res.status(400).json({ message: "Missing agentId" });
      return;
    }

    //check  agent  existence
    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId as string,
      },
      select: {
        workspaceId: true,
      },
    });

    if (!agent) {
      res.status(404).json({ message: "Agent not found" });
      return;
    }

    // Check if the user is an admin or owner of the workspace
    await requireWorkspaceRole(agent.workspaceId as string, userId, [
      "OWNER",
      "ADMIN",
    ]);

    await prisma.agent.delete({
      where: {
        id: agentId as string,
      },
    });

    res.status(204).json({
      success: true,
      message: "Agent deleted successfully",
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`Something went wrong while deleting agent`, err);
    res
      .status(500)
      .json({ success: false, message: "Server side error", error: err });
  }
};
