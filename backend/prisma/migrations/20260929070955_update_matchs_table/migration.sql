/*
  Warnings:

  - Made the column `endedAt` on table `matchs` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "matchs" ALTER COLUMN "startedAt" DROP DEFAULT,
ALTER COLUMN "endedAt" SET NOT NULL;
