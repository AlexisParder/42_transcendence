/*
  Warnings:

  - You are about to drop the `Conversations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Conversations" DROP CONSTRAINT "Conversations_targetId_fkey";

-- DropForeignKey
ALTER TABLE "Conversations" DROP CONSTRAINT "Conversations_userId_fkey";

-- DropTable
DROP TABLE "Conversations";

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sendAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversations_userId_idx" ON "conversations"("userId");

-- CreateIndex
CREATE INDEX "conversations_targetId_idx" ON "conversations"("targetId");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
