import prisma from "../lib/prisma.js";
import { removeExamDocument } from "../lib/searchIndexSync.js";
import fs from "fs/promises";

/*
 * Deletes a file from the filesystem if it exists otherswise does nothing.
 */
async function deleteFileSafely(filePath: string | null | undefined) {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (err: any) {
    if (err.code !== "ENOENT") {
    }
  }
}

/*
 * Deletes a past exam and all its annexes from the database and the filesystem.
 */
export const deletePastExamWithFiles = async (
  pastExamId: number,
): Promise<void> => {
  const exam = await prisma.pastExam.findUnique({
    where: { id: pastExamId },
    include: { annexe: true },
  });
  if (!exam) return;

  await Promise.all(exam?.annexe.map((a) => deleteFileSafely(a.path)));
  await deleteFileSafely(exam.path);
  await prisma.pastExam.delete({ where: { id: pastExamId } });

  // Sync MeiliSearch
  try {
    await removeExamDocument(pastExamId);
  } catch (error) {
    console.error(
      "Meilisearch sync warning after cascade delete pastExam:",
      error,
    );
  }
};

/*
 * Deletes all past exams and their annexes for a given course from the filesystem.
 */
export async function deletePastExamForCourse(courseId: number): Promise<void> {
  const pastExams = await prisma.pastExam.findMany({
    where: { courseId },
    select: { id: true },
  });
  await Promise.all(pastExams.map((e) => deletePastExamWithFiles(e.id)));
}

/*
 * Deletes a course and all its past exams and annexes from the database and the filesystem.
 */
export async function deleteCourseCascade(courseId: number): Promise<void> {
  await deletePastExamForCourse(courseId);
  await prisma.course.delete({ where: { id: courseId } });
}
