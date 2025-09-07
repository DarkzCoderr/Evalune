/*
  Warnings:

  - You are about to drop the column `videoUrl` on the `Response` table. All the data in the column will be lost.
  - You are about to drop the column `education` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `experience` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `internships` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `projects` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `rawText` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `skills` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the `Record` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `questions` to the `Interview` table without a default value. This is not possible if the table is not empty.
  - Made the column `parsedJson` on table `Resume` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Record" DROP CONSTRAINT "Record_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Interview" ADD COLUMN     "questions" JSONB NOT NULL,
ADD COLUMN     "score" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."Response" DROP COLUMN "videoUrl",
ADD COLUMN     "audioUrl" TEXT;

-- AlterTable
ALTER TABLE "public"."Resume" DROP COLUMN "education",
DROP COLUMN "email",
DROP COLUMN "experience",
DROP COLUMN "fileUrl",
DROP COLUMN "internships",
DROP COLUMN "name",
DROP COLUMN "phone",
DROP COLUMN "projects",
DROP COLUMN "rawText",
DROP COLUMN "skills",
ALTER COLUMN "parsedJson" SET NOT NULL;

-- DropTable
DROP TABLE "public"."Record";

-- CreateIndex
CREATE INDEX "Interview_userId_idx" ON "public"."Interview"("userId");

-- CreateIndex
CREATE INDEX "Interview_resumeId_idx" ON "public"."Interview"("resumeId");

-- CreateIndex
CREATE INDEX "Response_interviewId_idx" ON "public"."Response"("interviewId");
