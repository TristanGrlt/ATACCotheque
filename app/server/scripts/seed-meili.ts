import { MeiliSearch } from 'meilisearch';
import dotenv from 'dotenv';
dotenv.config();

const host = process.env.MEILI_HOST || 'http://meilisearch:7700';
const apiKey = process.env.MEILI_MASTER_KEY || 'devMasterKey';

const client = new MeiliSearch({ host, apiKey });
const majors = ["Informatique", "Maths", "Physique"];
const levels = ["L1", "L2", "L3", "M1", "M2"];
const subjects = ["Algèbre", "Analyse", "Thermodynamique", "Bases de données", "Algorithmique", "Réseaux", "Electromagnétisme"];

const mockExams = Array.from({ length: 200 }).map((_, i) => {
  const major = majors[Math.floor(Math.random() * majors.length)];
  const level = levels[Math.floor(Math.random() * levels.length)];
  const subject = subjects[Math.floor(Math.random() * subjects.length)];
  const year = 2015 + Math.floor(Math.random() * 11); // Range: 2015-2025

  return {
    id: (i + 1).toString(),
    course: `${subject} ${level}`,
    title: `${subject} - ${level} (${year})`,
    level: level,
    major: major,
    year: year,
    path: `/${major}/${level}/${subject.toLowerCase().replace(/ /g, '_')}_${year}.pdf`
  };
});

async function seed() {
  console.log(`Connecting to Meili at: ${host}`);
  const index = client.index('exams');

  console.log('Updating settings...');
  await index.updateFilterableAttributes(['level', 'major', 'year']);

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
