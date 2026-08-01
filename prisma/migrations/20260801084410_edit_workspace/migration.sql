/*
  Warnings:

  - A unique constraint covering the columns `[workspaceId,userId]` on the table `WorkspaceMember` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "AIProvider" ADD VALUE 'ANTHROPIC';

-- DropIndex
DROP INDEX "WorkspaceMember_userId_idx";

-- DropIndex
DROP INDEX "WorkspaceMember_workspaceId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");
