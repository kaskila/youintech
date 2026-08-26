-- CreateEnum
CREATE TYPE "ProgrammeStatus" AS ENUM ('PLANNED', 'UPCOMING', 'RUNNING', 'COMPLETED');

-- CreateTable
CREATE TABLE "Programme" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "coverAlt" TEXT,
    "icon" TEXT NOT NULL,
    "status" "ProgrammeStatus" NOT NULL DEFAULT 'PLANNED',
    "isFlagship" BOOLEAN NOT NULL DEFAULT false,
    "applicationsOpen" BOOLEAN NOT NULL DEFAULT false,
    "applicationUrl" TEXT,
    "targetDate" TIMESTAMP(3),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "contentStatus" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Programme_slug_key" ON "Programme"("slug");

-- CreateIndex
CREATE INDEX "Programme_contentStatus_displayOrder_idx" ON "Programme"("contentStatus", "displayOrder");
