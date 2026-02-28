-- AlterTable: add contact fields to afiliados
ALTER TABLE "afiliados"
    ADD COLUMN IF NOT EXISTS "telefono" TEXT,
    ADD COLUMN IF NOT EXISTS "mail" TEXT,
    ADD COLUMN IF NOT EXISTS "calle" TEXT,
    ADD COLUMN IF NOT EXISTS "altura" TEXT;
