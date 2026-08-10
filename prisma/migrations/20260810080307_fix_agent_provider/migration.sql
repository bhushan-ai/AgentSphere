/*
  Warnings:

  - Changed the type of `model` on the `Agent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `provider` on the `Agent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Agent" DROP COLUMN "model",
ADD COLUMN     "model" TEXT NOT NULL,
DROP COLUMN "provider",
ADD COLUMN     "provider" "AIProvider" NOT NULL;
