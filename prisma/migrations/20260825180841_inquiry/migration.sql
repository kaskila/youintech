-- CreateEnum
CREATE TYPE "InquiryCategory" AS ENUM ('VOLUNTEER', 'PARTNER', 'SUPPORT', 'GENERAL');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'REVIEWING', 'RESPONDED', 'CLOSED');

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "category" "InquiryCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "organisation" TEXT,
    "message" TEXT NOT NULL,
    "consentedAt" TIMESTAMP(3) NOT NULL,
    "privacyPolicyVersion" TEXT NOT NULL,
    "retentionUntil" TIMESTAMP(3),
    "anonymisedAt" TIMESTAMP(3),
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Inquiry_status_createdAt_idx" ON "Inquiry"("status", "createdAt");
