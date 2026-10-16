-- AlterTable
ALTER TABLE "notifications" ADD COLUMN "title" TEXT,
ADD COLUMN "description" TEXT,
ADD COLUMN "params" JSONB;

-- Migrate existing notifications to translation keys
UPDATE "notifications" SET
    "title" = 'notifications_friend_request',
    "description" = 'notifications_friend_request_message',
    "params" = jsonb_build_object('username', regexp_replace("message", ' sent you a friend request$', ''))
WHERE "type" = 'FRIEND_REQUEST';

UPDATE "notifications" SET
    "title" = 'notifications_new_message',
    "description" = 'notifications_new_message_body',
    "params" = jsonb_build_object('message', regexp_replace("message", '^New message: ', ''))
WHERE "type" = 'MESSAGE';

UPDATE "notifications" SET
    "title" = 'notifications_item',
    "description" = "message"
WHERE "title" IS NULL;

-- AlterTable
ALTER TABLE "notifications" ALTER COLUMN "title" SET NOT NULL,
ALTER COLUMN "description" SET NOT NULL,
DROP COLUMN "type",
DROP COLUMN "message";
