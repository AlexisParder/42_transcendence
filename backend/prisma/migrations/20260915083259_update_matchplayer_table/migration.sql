/*
  Warnings:

  - You are about to drop the column `isBOt` on the `MatchPlayers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MatchPlayers" DROP COLUMN "isBOt",
ADD COLUMN     "isBot" BOOLEAN NOT NULL DEFAULT true;
