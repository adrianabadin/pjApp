-- Migration: init
-- Adds id/is_seen/assigned_user_id to existing afiliados table
-- Creates new users table
-- Renames padron_saladillo PK constraint to Prisma convention

-- CreateTable users (new table)
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'operator',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AlterTable afiliados: add new columns only
ALTER TABLE "afiliados"
    ADD COLUMN "id" SERIAL NOT NULL,
    ADD COLUMN "is_seen" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "assigned_user_id" TEXT;

-- Add PK constraint on afiliados.id
ALTER TABLE "afiliados" ADD CONSTRAINT "afiliados_pkey" PRIMARY KEY ("id");

-- Rename padron_saladillo PK to Prisma convention (safe separate statement)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'pk_padron_saladillo'
    ) THEN
        ALTER TABLE "padron_saladillo"
            RENAME CONSTRAINT "pk_padron_saladillo" TO "padron_saladillo_pkey";
    END IF;
END $$;

-- AddForeignKey
ALTER TABLE "afiliados" ADD CONSTRAINT "afiliados_assigned_user_id_fkey"
    FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
