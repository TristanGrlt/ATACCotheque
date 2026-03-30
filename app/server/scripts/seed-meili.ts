import "dotenv/config";
import { MeiliSearch } from "meilisearch";
import prisma from "../lib/prisma.js";

// Configuration
const host = process.env.MEILI_HOST || "http://meilisearch:7700";
const apiKey = process.env.MEILI_MASTER_KEY || "devMasterKey";
const meiliClient = new MeiliSearch({ host, apiKey });

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

async function seedMeilisearch() {
  console.log(`🔎 Connecting to Meilisearch at: ${host}`);
  const index = meiliClient.index("exams");

  console.log("🗑️  Clearing existing Meilisearch documents...");
  const deleteTask = await index.deleteAllDocuments();
  console.log(`✅ Delete task queued. Task UID: ${deleteTask.taskUid}`);

  console.log("🔄 Fetching exams from the PostgreSQL database...");

  const exams = await prisma.pastExam.findMany({
    include: {
      examtype: true,
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
      annexe: true,
    },
  });

  if (exams.length === 0) {
    console.log("⚠️ No PastExams found in database. Exiting.");
    return;
  }

  const documents = exams.map((exam) => {
    const firstParcours = exam.course?.parcours?.[0];
    const parcoursName = firstParcours?.name || "N/A";

    const majors = firstParcours?.majors || [];
    const majorsPayload = majors.map((m) => ({
      name: m.name,
      icon: m.icon || null,
    }));

    const annexes = exam.annexe.map((annexe) => ({
      name: annexe.name,
    }));

    const aliases = parseAliases(exam.course?.aliases);

    return {
      id: exam.id.toString(),
      course: exam.course?.name || "N/A",
      type: exam.examtype?.name || "N/A",
      level: exam.course?.level?.name || "N/A",
      majorName: majors[0]?.name || "N/A",
      majors: majorsPayload,
      parcours: parcoursName,
      year: exam.year,
      aliases,
      annexes: annexes,
    };
  });

  console.log("⚙️  Applying Meilisearch index settings...");
  await index.updateFilterableAttributes([
    "level",
    "majors.name",
    "parcours",
    "year",
    "type",
  ]);

  await index.updateSynonyms({
    maths: ["mathématiques"],
    mathématiques: ["maths"],
    bdd: ["bases de données", "database"],
    partiel: ["examen de mi-semestre"],
    algo: ["algorithmique"],
  });

  await index.updateSearchableAttributes([
    "course",
    "type",
    "level",
    "majors.name",
    "parcours",
    "aliases",
  ]);

  console.log(`📤 Sending ${documents.length} documents to Meilisearch...`);
  const addTask = await index.addDocuments(documents);

  console.log(`✅ Data sent successfully. Task UID: ${addTask.taskUid}`);
}

seedMeilisearch()
  .catch((e) => {
    console.error("❌ Error during Meilisearch seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("🔌 Database disconnected.");
  });
