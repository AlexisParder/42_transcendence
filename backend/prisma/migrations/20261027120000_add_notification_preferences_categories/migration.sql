ALTER TABLE "notification_preferences"
ADD COLUMN "app_achievements" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "app_security" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "email_achievements" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "email_security" BOOLEAN NOT NULL DEFAULT true;
