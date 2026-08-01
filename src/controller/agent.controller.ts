import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireWorkspaceRole } from "../middleware/checkRole";

//create an agent
export const createAgent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, description, model, provider, systemPrompt, temperature } =
      req.body;

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
