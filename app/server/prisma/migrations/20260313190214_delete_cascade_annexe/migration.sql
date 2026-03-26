-- DropForeignKey
ALTER TABLE "Annexe" DROP CONSTRAINT "Annexe_pastExamId_fkey";

-- AddForeignKey
ALTER TABLE "Annexe" ADD CONSTRAINT "Annexe_pastExamId_fkey" FOREIGN KEY ("pastExamId") REFERENCES "PastExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
