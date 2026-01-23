import { MeiliSearch } from 'meilisearch';
import dotenv from 'dotenv';
dotenv.config();

const host = process.env.MEILI_HOST || 'http://meilisearch:7700';
const apiKey = process.env.MEILI_MASTER_KEY || 'devMasterKey';

const client = new MeiliSearch({ host, apiKey });

const mockExams = [
  {
    id: '1',
    course: 'Algèbre Linéaire',
    semester: 'S2',
    level: 'L1',
    major: 'Informatique',
    examType: 'Controle Continu',
    year: 2023
  },
  {
    id: '2',
    course: 'Bases de données',
    semester: 'S4',
    level: 'L2',
    major: 'Informatique',
    examType: 'Examen Final',
    year: 2022
  },
  {
    id: '3',
    course: 'Probabilités',
    semester: 'S1',
    level: 'L1',
    major: 'Mathématiques',
    examType: 'Examen de Seconde Chance',
    year: 2024
  },
];

async function seed() {
  console.log(`Connecting to Meili at: ${host}`);
  const index = client.index('exams');

  // Configure Synonyms
  await index.updateSynonyms({
    'maths': ['mathématiques'],
    'mathématiques': ['maths'],
    'bdd': ['bases de données', 'database'],
    'partiel': ['examen de mi-semestre'],
    'algo': ['algorithmique']
  });

  // Add Documents
  const task = await index.addDocuments(mockExams);
  console.log(`Synonyms configured and fake data sent. Task UID: ${task.taskUid}`);
}

seed().catch(console.error);
