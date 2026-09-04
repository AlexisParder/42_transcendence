-- CreateTable
CREATE TABLE "friends" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,

    CONSTRAINT "friends_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "friends_userId_idx" ON "friends"("userId");

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
