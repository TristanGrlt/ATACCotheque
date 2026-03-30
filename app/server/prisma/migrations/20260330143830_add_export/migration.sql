-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- AlterEnum
ALTER TYPE "AppPermission" ADD VALUE 'MANAGE_IMPORT_EXPORT';

-- CreateTable
CREATE TABLE "ExportJob" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "status" "ExportStatus" NOT NULL DEFAULT 'PENDING',
    "sizeBytes" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "ExportJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExportJob_filename_key" ON "ExportJob"("filename");
