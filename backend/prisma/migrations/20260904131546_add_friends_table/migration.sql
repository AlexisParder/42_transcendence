-- CreateIndex
CREATE INDEX "friends_targetId_idx" ON "friends"("targetId");

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
