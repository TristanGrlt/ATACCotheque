/*
  Warnings:

  - You are about to drop the column `LevelId` on the `Course` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[levelId]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `levelId` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_LevelId_fkey";

-- DropIndex
DROP INDEX "Course_LevelId_key";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "LevelId",
ADD COLUMN     "levelId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Course_levelId_key" ON "Course"("levelId");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
