import { prisma } from "../lib/prisma";

export const requireWorkspaceRole = async (
  workspaceId: string,
  userId: string,
  roles: ("OWNER" | "ADMIN" | "MEMBER")[],
) => {
  const workspaceMember = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  });
  
  if (!workspaceMember || !roles.includes(workspaceMember.role)) {
    throw new Error("You are not authorized to perform this action");
  }

  return workspaceMember;
};
