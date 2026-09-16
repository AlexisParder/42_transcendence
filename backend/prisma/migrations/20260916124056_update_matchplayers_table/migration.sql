/*
  Warnings:

  - You are about to drop the column `shotHits` on the `matchplayers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "matchplayers" DROP COLUMN "shotHits",
ADD COLUMN     "shotsHit" INTEGER NOT NULL DEFAULT 0;
