import { MeiliSearch } from 'meilisearch';
import type { Prisma } from '@prisma/client';

type SearchSyncPrisma = {
  pastExam: {
    findMany: unknown;
  };
};

type ExamSource = {
  id: number;
  year: number;
  path: string;
  isVerified: boolean;
  examtype: { name: string } | null;
  course: {
    name: string;
    level: { name: string } | null;
    parcours: Array<{
      majors: Array<{ name: string }>;
    }>;
  } | null;
  annexe: Array<{
    id: number;
    name: string;
    type: string;
    url: string | null;
    path: string | null;
  }>;
};

interface ExamSearchDocument {
  id: number;
  year: number;
  course: string;
  type: string;
  level: string;
  major: string;
  path: string;
  isVerified: boolean;
  annexes: Array<{
    id: number;
    name: string;
    type: string;
    url: string | null;
  }>;
}

const host = process.env.MEILI_HOST || 'http://meilisearch:7700';
const apiKey = process.env.MEILI_MASTER_KEY || 'devMasterKey';

const meiliClient = new MeiliSearch({
  host,
  apiKey,
});

const examsIndex = meiliClient.index('exams');

function toExamSearchDocument(exam: ExamSource): ExamSearchDocument {
  const majorName = exam.course?.parcours?.[0]?.majors?.[0]?.name || 'Non defini';

  return {
    id: exam.id,
    year: exam.year,
    course: exam.course?.name || 'Inconnu',
    type: exam.examtype?.name || 'Inconnu',
    level: exam.course?.level?.name || 'Inconnu',
    major: majorName,
    path: exam.path,
    isVerified: exam.isVerified,
    annexes: exam.annexe.map((annexe) => ({
      id: annexe.id,
      name: annexe.name,
      type: annexe.type,
      url: annexe.url || annexe.path,
    })),
  };
}

async function upsertDocumentsFromExams(
  prisma: SearchSyncPrisma,
  whereClause: Prisma.PastExamWhereInput
): Promise<void> {
  if (typeof prisma.pastExam.findMany !== 'function') {
    throw new Error('Invalid prisma client: pastExam.findMany is missing.');
  }

  const findMany = prisma.pastExam.findMany as (
    args: Prisma.PastExamFindManyArgs
  ) => Promise<unknown>;

  const examsResult = await findMany({
    where: whereClause,
    include: {
      examtype: true,
      annexe: true,
      course: {
        include: {
          level: true,
          parcours: {
            include: {
              majors: true,
            },
          },
        },
      },
    },
  });

  if (!Array.isArray(examsResult) || examsResult.length === 0) {
    return;
  }

  const documents = (examsResult as ExamSource[]).map((exam) => toExamSearchDocument(exam));
  await examsIndex.addDocuments(documents);
}

export async function upsertVerifiedExamDocument(prisma: SearchSyncPrisma, examId: number): Promise<void> {
  await upsertDocumentsFromExams(prisma, {
    id: examId,
    isVerified: true,
  });
}

export async function removeExamDocument(examId: number): Promise<void> {
  await examsIndex.deleteDocument(examId);
}

export async function syncExamsForUpdatedEntities(
  prisma: SearchSyncPrisma,
  input: {
    courseIds?: number[];
    majorIds?: number[];
    examTypeIds?: number[];
  }
): Promise<void> {
  const courseIds = (input.courseIds || []).filter((value) => Number.isInteger(value));
  const majorIds = (input.majorIds || []).filter((value) => Number.isInteger(value));
  const examTypeIds = (input.examTypeIds || []).filter((value) => Number.isInteger(value));

  if (courseIds.length === 0 && majorIds.length === 0 && examTypeIds.length === 0) {
    return;
  }

  await upsertDocumentsFromExams(prisma, {
    isVerified: true,
    OR: [
      ...(courseIds.length > 0 ? [{ courseId: { in: courseIds } }] : []),
      ...(examTypeIds.length > 0 ? [{ examTypeId: { in: examTypeIds } }] : []),
      ...(majorIds.length > 0
        ? [{ course: { parcours: { some: { majors: { some: { id: { in: majorIds } } } } } } }]
        : []),
    ],
  });
}

export async function rebuildExamsIndex(prisma: SearchSyncPrisma): Promise<void> {
  await examsIndex.deleteAllDocuments();
  await upsertDocumentsFromExams(prisma, {
    isVerified: true,
  });
}
