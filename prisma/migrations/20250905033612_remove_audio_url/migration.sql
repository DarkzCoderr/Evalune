/*
  Warnings:

  - You are about to drop the column `audioUrl` on the `Answer` table. All the data in the column will be lost.
  - Made the column `transcript` on table `Answer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Answer" DROP COLUMN "audioUrl",
ALTER COLUMN "transcript" SET NOT NULL;
