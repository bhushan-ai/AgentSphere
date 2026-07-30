import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

//create a workspace
export const createWorkspace = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const { name } = req.body;

    if (!name?.trim()) {
      res.status(400).json({
        success: false,
        message: "Workspace name is required",
      });
      return;
    }

    const exists = await prisma.workspace.findFirst({
      where: {
        ownerId: userId,
        name,
      },
    });

    if (exists) {
      res.status(409).json({
        success: false,
        message: "Workspace already exists",
      });
      return;
    }

    const [workspace, workspaceMember] = await prisma.$transaction(
      async (tx) => {
        const workspace = await tx.workspace.create({
          data: {
            name: name,
            ownerId: userId,
          },
        });

        const workspaceMember = await tx.workspaceMember.create({
          data: {
            workspaceId: workspace.id,
            userId: userId,
            role: "OWNER",
          },
        });
        return [workspace, workspaceMember];
      },
    );

    res.status(201).json({
      success: true,
      message: "Workspace created successfully",
      data: {
        workspace,
        ownerRole: workspaceMember.role,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`Something went wrong while creating the workspace`, err);

    res
      .status(500)
      .json({ success: false, message: "Server side error", error: err });
  }
};

//get a workspace
export const getWorkspace = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId: string = req.user?.id;

    if (!userId) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const workspaces = await prisma.workspace.findMany({
      where: {
        workspaceMembers: {
          some: {
            userId: userId,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Workspace retrieved successfully",
      data: workspaces,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`Something went wrong while getting the workspace`, err);

    res
      .status(500)
      .json({ success: false, message: "Server side error", error: err });
  }
};

//invite a user to workspace
export const inviteUserToWorkspace = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId: string = req.user?.id;

    if (!userId) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const { email, role } = req.body;
    const workspaceId = req.params.workspaceId;

    if (!email || !workspaceId) {
      res.status(400).json({
        success: false,
        message: "Email and workspaceId are required",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    //check if workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: {
        id: workspaceId as string,
      },
    });

    if (!workspace) {
      res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
      return;
    }

    //check if the user is an admin of the workspace
    const member = await prisma.workspaceMember.findFirst({
      where: {
        userId: userId,
        workspaceId: workspaceId as string,
      },
    });

    if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to invite users to this workspace",
      });
      return;
    }

    //check if the user is already a member of the workspace
    const checkMember = await prisma.workspaceMember.findFirst({
      where: {
        userId: user.id,
        workspaceId: workspaceId as string,
      },
    });

    if (checkMember) {
      res.status(400).json({
        success: false,
        message: "User is already a member of the workspace",
      });
      return;
    }

    //add member to workspace
    const workspaceMember = await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspaceId as string,
        role: role,
      },
    });

    res.status(201).json({
      success: true,
      message: "User invited to workspace successfully",
      data: {
        id: workspaceMember.id,
        role: workspaceMember.role,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.log(
      `Something went wrong while inviting the user to workspace`,
      err,
    );

    res
      .status(500)
      .json({ success: false, message: "Server side error", error: err });
  }
};
