-- CreateEnum
CREATE TYPE "MatchMode" AS ENUM ('ONE_V_ONE', 'TWO_V_TWO', 'THREE_FFA', 'FOUR_FFA');

-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('PLAYED', 'LEFT');

-- CreateTable
CREATE TABLE "Matchs" (
    "id" TEXT NOT NULL,
    "mode" "MatchMode" NOT NULL,
    "isRanked" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "Matchs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchPlayers" (
    "id" TEXT NOT NULL,
    "matchsId" TEXT,
    "userId" TEXT,
    "isBOt" BOOLEAN NOT NULL DEFAULT true,
    "team" INTEGER NOT NULL,
    "placement" INTEGER,
    "points" INTEGER NOT NULL DEFAULT 0,
    "status" "PlayerStatus" NOT NULL DEFAULT 'PLAYED',

    CONSTRAINT "MatchPlayers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MatchPlayers_matchsId_userId_key" ON "MatchPlayers"("matchsId", "userId");

-- AddForeignKey
ALTER TABLE "MatchPlayers" ADD CONSTRAINT "MatchPlayers_matchsId_fkey" FOREIGN KEY ("matchsId") REFERENCES "Matchs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayers" ADD CONSTRAINT "MatchPlayers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
