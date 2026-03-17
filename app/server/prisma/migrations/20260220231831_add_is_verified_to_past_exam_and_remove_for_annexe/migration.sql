/*
  Warnings:

  - You are about to drop the column `isVerifed` on the `Annexe` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Annexe" DROP COLUMN "isVerifed";

-- AlterTable
ALTER TABLE "PastExam" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;
