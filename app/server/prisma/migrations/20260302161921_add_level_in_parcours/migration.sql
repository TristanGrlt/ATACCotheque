/*
  Warnings:

  - You are about to drop the column `LevelId` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `majorId` on the `Level` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Level` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pastExamId` to the `Annexe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `levelId` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `semestre` on the `Course` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_LevelId_fkey";

-- DropForeignKey
ALTER TABLE "Level" DROP CONSTRAINT "Level_majorId_fkey";

-- AlterTable
ALTER TABLE "Annexe" ADD COLUMN     "pastExamId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "LevelId",
ADD COLUMN     "levelId" INTEGER NOT NULL,
DROP COLUMN "semestre",
ADD COLUMN     "semestre" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Level" DROP COLUMN "majorId";

-- CreateTable
CREATE TABLE "Parcours" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Parcours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MajorToParcours" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_MajorToParcours_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_LevelToParcours" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_LevelToParcours_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CourseToParcours" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CourseToParcours_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Parcours_name_key" ON "Parcours"("name");

-- CreateIndex
CREATE INDEX "_MajorToParcours_B_index" ON "_MajorToParcours"("B");

-- CreateIndex
CREATE INDEX "_LevelToParcours_B_index" ON "_LevelToParcours"("B");

-- CreateIndex
CREATE INDEX "_CourseToParcours_B_index" ON "_CourseToParcours"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Level_name_key" ON "Level"("name");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annexe" ADD CONSTRAINT "Annexe_pastExamId_fkey" FOREIGN KEY ("pastExamId") REFERENCES "PastExam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MajorToParcours" ADD CONSTRAINT "_MajorToParcours_A_fkey" FOREIGN KEY ("A") REFERENCES "Major"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MajorToParcours" ADD CONSTRAINT "_MajorToParcours_B_fkey" FOREIGN KEY ("B") REFERENCES "Parcours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LevelToParcours" ADD CONSTRAINT "_LevelToParcours_A_fkey" FOREIGN KEY ("A") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LevelToParcours" ADD CONSTRAINT "_LevelToParcours_B_fkey" FOREIGN KEY ("B") REFERENCES "Parcours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToParcours" ADD CONSTRAINT "_CourseToParcours_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToParcours" ADD CONSTRAINT "_CourseToParcours_B_fkey" FOREIGN KEY ("B") REFERENCES "Parcours"("id") ON DELETE CASCADE ON UPDATE CASCADE;
