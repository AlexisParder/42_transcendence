-- AlterTable
ALTER TABLE "notifications" ADD COLUMN "fromUserId" TEXT;

-- Replace stored usernames with the sender id
UPDATE "notifications" AS n SET
    "fromUserId" = u."id",
    "params" = n."params" - 'username'
FROM "user" AS u
WHERE n."params" ->> 'username' = u."username";

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
