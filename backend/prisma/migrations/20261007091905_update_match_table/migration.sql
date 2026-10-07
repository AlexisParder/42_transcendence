/*
  Warnings:

  - You are about to drop the column `mode` on the `matchs` table. All the data in the column will be lost.
  - Added the required column `type` to the `matchs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('ONE_V_ONE', 'TWO_V_TWO', 'THREE_FFA', 'FOUR_FFA');

-- AlterTable
ALTER TABLE "matchs" DROP COLUMN "mode",
ADD COLUMN     "type" "MatchType" NOT NULL;

-- DropEnum
DROP TYPE "MatchMode";
