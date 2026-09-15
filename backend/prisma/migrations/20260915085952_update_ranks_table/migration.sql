/*
  Warnings:

  - A unique constraint covering the columns `[min]` on the table `ranks` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ranks_min_key" ON "ranks"("min");
