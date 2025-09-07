-- AlterTable
ALTER TABLE "public"."Resume" ADD COLUMN     "education" JSONB,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "experience" JSONB,
ADD COLUMN     "internships" JSONB,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "projects" JSONB,
ADD COLUMN     "rawText" TEXT,
ADD COLUMN     "skills" JSONB;
