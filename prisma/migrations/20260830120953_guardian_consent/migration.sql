-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "ageBracket" TEXT,
ADD COLUMN     "guardianConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "guardianEmail" TEXT,
ADD COLUMN     "guardianName" TEXT;
