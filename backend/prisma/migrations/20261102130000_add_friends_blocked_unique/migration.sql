-- CreateIndex
CREATE UNIQUE INDEX "friends_userId_targetId_key" ON "friends"("userId", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "userblocked_userId_targetId_key" ON "userblocked"("userId", "targetId");
