/*
  Warnings:

  - The values [THREE_FFA,FOUR_FFA] on the enum `MatchType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MatchType_new" AS ENUM ('ONE_V_ONE', 'TWO_V_TWO', 'FFA', 'BOT');
ALTER TABLE "matchs" ALTER COLUMN "type" TYPE "MatchType_new" USING ("type"::text::"MatchType_new");
ALTER TYPE "MatchType" RENAME TO "MatchType_old";
ALTER TYPE "MatchType_new" RENAME TO "MatchType";
DROP TYPE "public"."MatchType_old";
COMMIT;
