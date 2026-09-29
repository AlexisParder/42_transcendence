/*
  Warnings:

  - Made the column `matchsId` on table `matchplayers` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "matchplayers" DROP CONSTRAINT "matchplayers_matchsId_fkey";

-- AlterTable
ALTER TABLE "matchplayers" ALTER COLUMN "matchsId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "matchplayers" ADD CONSTRAINT "matchplayers_matchsId_fkey" FOREIGN KEY ("matchsId") REFERENCES "matchs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
