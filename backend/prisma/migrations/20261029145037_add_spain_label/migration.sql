/*
  Warnings:

  - A unique constraint covering the columns `[fr_label]` on the table `ranks` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[es_label]` on the table `ranks` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `es_label` to the `ranks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ranks" ADD COLUMN     "es_label" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ranks_fr_label_key" ON "ranks"("fr_label");

-- CreateIndex
CREATE UNIQUE INDEX "ranks_es_label_key" ON "ranks"("es_label");
