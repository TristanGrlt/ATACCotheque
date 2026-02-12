-- CreateEnum
CREATE TYPE "Type" AS ENUM ('FILE', 'URL');

-- CreateTable
CREATE TABLE "Major" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Major_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Level" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "majorId" INTEGER NOT NULL,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "semeste" TEXT NOT NULL,
    "LevelId" INTEGER NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ExamType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PastExam" (
    "id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "examTypeId" INTEGER NOT NULL,

    CONSTRAINT "PastExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Annexe" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "Type" NOT NULL,
    "isVerifed" BOOLEAN NOT NULL,
    "path" TEXT,
    "url" TEXT,

    CONSTRAINT "Annexe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CourseToExamType" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CourseToExamType_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Major_name_key" ON "Major"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Level_name_key" ON "Level"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Course_name_key" ON "Course"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Course_LevelId_key" ON "Course"("LevelId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamType_name_key" ON "ExamType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PastExam_path_key" ON "PastExam"("path");

-- CreateIndex
CREATE UNIQUE INDEX "PastExam_courseId_key" ON "PastExam"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "PastExam_examTypeId_key" ON "PastExam"("examTypeId");

-- CreateIndex
CREATE INDEX "_CourseToExamType_B_index" ON "_CourseToExamType"("B");

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_majorId_fkey" FOREIGN KEY ("majorId") REFERENCES "Major"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_LevelId_fkey" FOREIGN KEY ("LevelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastExam" ADD CONSTRAINT "PastExam_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastExam" ADD CONSTRAINT "PastExam_examTypeId_fkey" FOREIGN KEY ("examTypeId") REFERENCES "ExamType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToExamType" ADD CONSTRAINT "_CourseToExamType_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToExamType" ADD CONSTRAINT "_CourseToExamType_B_fkey" FOREIGN KEY ("B") REFERENCES "ExamType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
