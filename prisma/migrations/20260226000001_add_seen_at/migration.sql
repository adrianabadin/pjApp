-- Add seen_at timestamp to afiliados to track when presence was confirmed
ALTER TABLE "afiliados" ADD COLUMN "seen_at" TIMESTAMPTZ DEFAULT NULL;
