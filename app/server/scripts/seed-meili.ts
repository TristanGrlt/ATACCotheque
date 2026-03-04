import { MeiliSearch } from 'meilisearch';
import { Prisma } from '../generated/prisma/client';
import prisma from '../lib/prisma';
import dotenv from 'dotenv';
dotenv.config();

const host = process.env.MEILI_HOST || 'http://meilisearch:7700';
const apiKey = process.env.MEILI_MASTER_KEY || 'devMasterKey';

const examQuery = Prisma.validator<Prisma.PastExamDefaultArgs>()({
  include: {
    examtype: true,
    course: {
      include: {
        level: { include: { major: true } }
      }
    }
  }
});

type ExamWithRelations = Prisma.PastExamGetPayload<typeof examQuery>;

async function seed() {
  console.log(`Connecting to Meili at: ${host}`);
  const index = client.index('exams');
  const exams = await prisma.pastExam.findMany(examQuery);

  const documents = exams.map((exam: ExamWithRelations) => ({
    id: exam.id.toString(),
    course: exam.course.name,
    type: exam.examtype.name,
    level: exam.course.level.name,
    major: exam.course.level.major.name,
    year: exam.year,
    path: exam.path
  }));

  console.log('Updating settings...');
  await index.updateFilterableAttributes(['level', 'major', 'year', 'type']);

  // Configure Synonyms
  await index.updateSynonyms({
    'maths': ['mathématiques'],
    'mathématiques': ['maths'],
    'bdd': ['bases de données', 'database'],
    'partiel': ['examen de mi-semestre'],
    'algo': ['algorithmique']
  });

  // Add Documents
  const task = await index.addDocuments(documents);
  console.log(`Synonyms configured and fake data sent. Task UID: ${task.taskUid}`);
}

seed().catch(console.error).finally(() => prisma.$disconnect());
