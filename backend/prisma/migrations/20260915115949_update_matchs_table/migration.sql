/*
  Warnings:

  - You are about to drop the `MatchPlayers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Matchs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MatchPlayers" DROP CONSTRAINT "MatchPlayers_matchsId_fkey";

-- DropForeignKey
ALTER TABLE "MatchPlayers" DROP CONSTRAINT "MatchPlayers_userId_fkey";

-- DropTable
DROP TABLE "MatchPlayers";

-- DropTable
DROP TABLE "Matchs";

-- CreateTable
CREATE TABLE "matchs" (
    "id" TEXT NOT NULL,
    "mode" "MatchMode" NOT NULL,
    "isRanked" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "matchs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matchplayers" (
    "id" TEXT NOT NULL,
    "matchsId" TEXT,
    "userId" TEXT,
    "isBot" BOOLEAN NOT NULL DEFAULT true,
    "team" INTEGER NOT NULL,
    "placement" INTEGER,
    "points" INTEGER NOT NULL DEFAULT 0,
    "status" "PlayerStatus" NOT NULL DEFAULT 'PLAYED',

    CONSTRAINT "matchplayers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "matchplayers_matchsId_userId_key" ON "matchplayers"("matchsId", "userId");

-- AddForeignKey
ALTER TABLE "matchplayers" ADD CONSTRAINT "matchplayers_matchsId_fkey" FOREIGN KEY ("matchsId") REFERENCES "matchs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchplayers" ADD CONSTRAINT "matchplayers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
