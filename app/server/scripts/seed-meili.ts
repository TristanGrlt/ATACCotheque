import { MeiliSearch } from 'meilisearch';
import dotenv from 'dotenv';
dotenv.config();

const host = process.env.MEILI_HOST || 'http://meilisearch:7700';
const apiKey = process.env.MEILI_MASTER_KEY || 'devMasterKey';

const client = new MeiliSearch({ host, apiKey });

const mockExams = [
  { id: 1, title: 'Analyse 1 - S1', year: 2023, level: 'L1' },
  { id: 2, title: 'Algèbre Linéaire - S2', year: 2022, level: 'L1' },
  { id: 3, title: 'Bases de données - S3', year: 2024, level: 'L2' },
];

async function seed() {
  console.log(`Connecting to Meili at: ${host}`); // Debug log
  const index = client.index('exams');
  const task = await index.addDocuments(mockExams);
  console.log(`Placeholder data sent. Task UID: ${task.taskUid}`);
}

seed().catch(console.error);
