/*
  Warnings:

  - Made the column `isAccepted` on table `friends` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "friends" ALTER COLUMN "isAccepted" SET NOT NULL;

-- CreateTable
CREATE TABLE "Conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "messagge" TEXT NOT NULL,
    "sendAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Conversations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Conversations" ADD CONSTRAINT "Conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversations" ADD CONSTRAINT "Conversations_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
