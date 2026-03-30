import { MeiliSearch } from "meilisearch";
import type { Prisma } from "@prisma/client";

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
    aliases: string | null;
    level: { name: string } | null;
    parcours: Array<{
      name: string;
      majors: Array<{ name: string; icon: string }>;
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
  majorName: string;
  majors: Array<{ name: string }>;
  parcours: string;
  majorIcon: string;
  isVerified: boolean;
  aliases: string[];
  annexes: Array<{
    name: string;
  }>;
}

const host = process.env.MEILI_HOST || "http://meilisearch:7700";
const apiKey = process.env.MEILI_MASTER_KEY || "devMasterKey";

const meiliClient = new MeiliSearch({
  host,
  apiKey,
});

const examsIndex = meiliClient.index("exams");

let settingsEnsured = false;

async function ensureExamsIndexSettings(): Promise<void> {
  if (settingsEnsured) {
    return;
  }

  await examsIndex.updateSettings({
    filterableAttributes: ["level", "majors.name", "parcours", "year", "type"],
    sortableAttributes: ["year"],
    searchableAttributes: [
      "course",
      "type",
      "level",
      "majors.name",
      "parcours",
      "aliases",
    ],
  });

  settingsEnsured = true;
}

function parseAliases(rawAliases?: string | null): string[] {
  if (!rawAliases) return [];

  const uniqueAliases = new Set(
    rawAliases
      .split(",")
      .map((alias) => alias.trim())
      .filter((alias) => alias.length > 0),
  );

  return Array.from(uniqueAliases);
}

function toExamSearchDocument(exam: ExamSource): ExamSearchDocument {
  const firstParcours = exam.course?.parcours?.[0];
  const parcoursName = firstParcours?.name || "Non defini";
  const firstMajor = firstParcours?.majors?.[0];
  const majorName = firstMajor?.name || "Non defini";
  const majorIcon = firstMajor?.icon || "Book";
  const aliases = parseAliases(exam.course?.aliases);

  // Collect ALL majors from ALL parcours (fixes multi-parcours issue)
  const allMajors = exam.course?.parcours?.flatMap((p) => p.majors) || [];
  const uniqueMajors = Array.from(
    new Map(allMajors.map((m) => [m.name, m])).values(),
  );

  return {
    id: exam.id,
    year: exam.year,
    course: exam.course?.name || "Inconnu",
    type: exam.examtype?.name || "Inconnu",
    level: exam.course?.level?.name || "Inconnu",
    majorName: majorName,
    majors: uniqueMajors.map((m) => ({ name: m.name })),  // ← All majors now!
    parcours: parcoursName,
    majorIcon: majorIcon,
    isVerified: exam.isVerified,
    aliases,
    annexes: exam.annexe.map((annexe) => ({
      name: annexe.name,
    })),
  };
}

async function upsertDocumentsFromExams(
  prisma: SearchSyncPrisma,
  whereClause: Prisma.PastExamWhereInput,
): Promise<void> {
  await ensureExamsIndexSettings();

  if (typeof prisma.pastExam.findMany !== "function") {
    throw new Error("Invalid prisma client: pastExam.findMany is missing.");
  }

  const findMany = prisma.pastExam.findMany as (
    args: Prisma.PastExamFindManyArgs,
  ) => Promise<unknown>;

  const examsResult = await findMany({
    where: whereClause,
    include: {
      examtype: true,
      annexe: true,
      course: {
        select: {
          name: true,
          aliases: true,
          level: { select: { name: true } },
          parcours: {
            select: {
              name: true,
              majors: { select: { name: true, icon: true } },
            },
          },
        },
      },
    },
  });

  if (!Array.isArray(examsResult) || examsResult.length === 0) {
    return;
  }

  const documents = (examsResult as ExamSource[]).map((exam) =>
    toExamSearchDocument(exam),
  );
  await examsIndex.addDocuments(documents);
}

export async function upsertVerifiedExamDocument(
  prisma: SearchSyncPrisma,
  examId: number,
): Promise<void> {
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
  },
): Promise<void> {
  const courseIds = (input.courseIds || []).filter((value) =>
    Number.isInteger(value),
  );
  const majorIds = (input.majorIds || []).filter((value) =>
    Number.isInteger(value),
  );
  const examTypeIds = (input.examTypeIds || []).filter((value) =>
    Number.isInteger(value),
  );

  if (
    courseIds.length === 0 &&
    majorIds.length === 0 &&
    examTypeIds.length === 0
  ) {
    return;
  }

  await upsertDocumentsFromExams(prisma, {
    isVerified: true,
    OR: [
      ...(courseIds.length > 0 ? [{ courseId: { in: courseIds } }] : []),
      ...(examTypeIds.length > 0 ? [{ examTypeId: { in: examTypeIds } }] : []),
      ...(majorIds.length > 0
        ? [
            {
              course: {
                parcours: {
                  some: { majors: { some: { id: { in: majorIds } } } },
                },
              },
            },
          ]
        : []),
    ],
  });
}

export async function rebuildExamsIndex(
  prisma: SearchSyncPrisma,
): Promise<void> {
  await ensureExamsIndexSettings();
  await examsIndex.deleteAllDocuments();
  await upsertDocumentsFromExams(prisma, {
    isVerified: true,
  });
}
