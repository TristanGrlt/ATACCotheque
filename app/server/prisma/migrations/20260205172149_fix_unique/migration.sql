/*
  Warnings:

  - You are about to drop the column `semeste` on the `Course` table. All the data in the column will be lost.
  - Added the required column `semestre` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Course_LevelId_key";

-- DropIndex
DROP INDEX "Course_name_key";

-- DropIndex
DROP INDEX "PastExam_courseId_key";

-- DropIndex
DROP INDEX "PastExam_examTypeId_key";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "semeste",
ADD COLUMN     "semestre" TEXT NOT NULL;
