-- CreateTable
CREATE TABLE "userblocked" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,

    CONSTRAINT "userblocked_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "userblocked_userId_idx" ON "userblocked"("userId");

-- CreateIndex
CREATE INDEX "userblocked_targetId_idx" ON "userblocked"("targetId");

-- AddForeignKey
ALTER TABLE "userblocked" ADD CONSTRAINT "userblocked_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userblocked" ADD CONSTRAINT "userblocked_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
