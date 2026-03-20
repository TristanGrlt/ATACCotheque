/*
  Warnings:

  - You are about to drop the column `majorId` on the `Level` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Level` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `semestre` on the `Course` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Level" DROP CONSTRAINT "Level_majorId_fkey";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "semestre",
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
CREATE INDEX "_CourseToParcours_B_index" ON "_CourseToParcours"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Level_name_key" ON "Level"("name");

-- AddForeignKey
ALTER TABLE "_MajorToParcours" ADD CONSTRAINT "_MajorToParcours_A_fkey" FOREIGN KEY ("A") REFERENCES "Major"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MajorToParcours" ADD CONSTRAINT "_MajorToParcours_B_fkey" FOREIGN KEY ("B") REFERENCES "Parcours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToParcours" ADD CONSTRAINT "_CourseToParcours_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToParcours" ADD CONSTRAINT "_CourseToParcours_B_fkey" FOREIGN KEY ("B") REFERENCES "Parcours"("id") ON DELETE CASCADE ON UPDATE CASCADE;
