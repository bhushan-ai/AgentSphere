/*
  Warnings:

  - The values [GROQ] on the enum `AIProvider` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AIProvider_new" AS ENUM ('OPENAI', 'GEMINI', 'GROK', 'ANTHROPIC');
ALTER TABLE "Agent" ALTER COLUMN "provider" TYPE "AIProvider_new" USING ("provider"::text::"AIProvider_new");
ALTER TYPE "AIProvider" RENAME TO "AIProvider_old";
ALTER TYPE "AIProvider_new" RENAME TO "AIProvider";
DROP TYPE "public"."AIProvider_old";
COMMIT;
