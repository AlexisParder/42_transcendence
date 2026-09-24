/*
  Warnings:

  - A unique constraint covering the columns `[en_label]` on the table `ranks` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ranks_en_label_key" ON "ranks"("en_label");
