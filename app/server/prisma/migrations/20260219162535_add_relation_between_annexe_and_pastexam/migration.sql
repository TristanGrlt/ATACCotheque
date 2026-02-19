/*
  Warnings:

  - Added the required column `pastExamId` to the `Annexe` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Annexe" ADD COLUMN     "pastExamId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Annexe" ADD CONSTRAINT "Annexe_pastExamId_fkey" FOREIGN KEY ("pastExamId") REFERENCES "PastExam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
