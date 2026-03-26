import 'dotenv/config';
import { MeiliSearch } from 'meilisearch';
import prisma from '../lib/prisma.js';

// Configuration
const host = process.env.MEILI_HOST || 'http://meilisearch:7700';
const apiKey = process.env.MEILI_MASTER_KEY || 'devMasterKey';
const meiliClient = new MeiliSearch({ host, apiKey });

async function seedMeilisearch() {
  console.log(`🔎 Connecting to Meilisearch at: ${host}`);
  const index = meiliClient.index('exams');

  console.log('🗑️  Clearing existing Meilisearch documents...');
  const deleteTask = await index.deleteAllDocuments();
  console.log(`✅ Delete task queued. Task UID: ${deleteTask.taskUid}`);

  console.log('🔄 Fetching exams from the PostgreSQL database...');
  
  const exams = await prisma.pastExam.findMany({
    include: {
      examtype: true,
      course: {
        include: {
          level: true,
          parcours: {
            include: {
              majors: true
            }
          }
        }
      }
    }
  });

  if (exams.length === 0) {
    console.log('⚠️ No PastExams found in database. Exiting.');
    return;
  }

  const documents = exams.map((exam) => {
    const majorsArray = Array.from(new Set(
      exam.course?.parcours?.flatMap(p => p.majors?.map(m => m.name) || []) || []
    ));

    return {
      id: exam.id.toString(),
      course: exam.course?.name || 'N/A',
      type: exam.examtype?.name || 'N/A',
      level: exam.course?.level?.name || 'N/A',
      major: majorsArray.length > 0 ? majorsArray.join(', ') : 'N/A',
      year: exam.year,
      path: exam.path
    };
  });

  console.log('⚙️  Applying Meilisearch index settings...');
  await index.updateFilterableAttributes(['level', 'major', 'year', 'type']);

  await index.updateSynonyms({
    'maths': ['mathématiques'],
    'mathématiques': ['maths'],
    'bdd': ['bases de données', 'database'],
    'partiel': ['examen de mi-semestre'],
    'algo': ['algorithmique']
  });

  console.log(`📤 Sending ${documents.length} documents to Meilisearch...`);
  const addTask = await index.addDocuments(documents);
  
  console.log(`✅ Data sent successfully. Task UID: ${addTask.taskUid}`);
}

seedMeilisearch()
  .catch((e) => {
    console.error('❌ Error during Meilisearch seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Database disconnected.');
  });