CREATE TABLE "notification_preferences" (
    "userId" TEXT NOT NULL,
    "app_friend" BOOLEAN NOT NULL DEFAULT true,
    "app_chat" BOOLEAN NOT NULL DEFAULT true,
    "email_friend" BOOLEAN NOT NULL DEFAULT false,
    "email_chat" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
