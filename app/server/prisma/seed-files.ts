import prisma from '../lib/prisma.js';
import { readdir } from "node:fs/promises";
import { join } from "node:path";

// Path mounted via docker-compose.dev.yml
const EXAMS_ROOT = "/app/data/exams";
const IMPORT_LIMIT = 10; // Change to 0 for a full import of all 800+ files

async function importExams() {
  let fileCount = 0;
  console.log('🚀 Starting the targeted file import...');

  try {
    // 1. Level Level (L1, L2, etc.)
    const levels = await readdir(EXAMS_ROOT, { withFileTypes: true });

    for (const levelEntry of levels.filter(e => e.isDirectory())) {
      const levelPath = join(EXAMS_ROOT, levelEntry.name);
      const majors = await readdir(levelPath, { withFileTypes: true });

      // 2. Major Level (IEEEA, MATH, etc.)
      for (const majorEntry of majors.filter(e => e.isDirectory())) {
        const major = await prisma.major.upsert({
          where: { name: majorEntry.name },
          update: {},
          create: { name: majorEntry.name }
        });

        // Ensure the Level is linked to the correct Major
        const level = await prisma.level.findFirst({
          where: { name: levelEntry.name, majorId: major.id }
        }) || await prisma.level.create({
          data: { name: levelEntry.name, majorId: major.id }
        });

        const coursesPath = join(levelPath, majorEntry.name);
        const courses = await readdir(coursesPath, { withFileTypes: true });

        // 3. Course Level (Algebre1, BPI, etc.)
        for (const courseEntry of courses.filter(e => e.isDirectory())) {
          // We use findFirst/create instead of upsert for Course 
          // to allow same-named courses in different levels
          const course = await prisma.course.findFirst({
            where: { name: courseEntry.name, LevelId: level.id }
          }) || await prisma.course.create({
            data: {
              name: courseEntry.name,
              semestre: "S1", // Default semester
              LevelId: level.id
            }
          });

          const typesPath = join(coursesPath, courseEntry.name);
          const types = await readdir(typesPath, { withFileTypes: true });

          // 4. ExamType Level (CC1, Examen, etc.)
          for (const typeEntry of types.filter(e => e.isDirectory())) {
            const examType = await prisma.examType.upsert({
              where: { name: typeEntry.name },
              update: {},
              create: { name: typeEntry.name }
            });

            const yearsPath = join(typesPath, typeEntry.name);
            const years = await readdir(yearsPath, { withFileTypes: true });

            // 5. Year Level (2013, 2024, etc.)
            for (const yearEntry of years.filter(e => e.isDirectory())) {
              const filesPath = join(yearsPath, yearEntry.name);
              const files = await readdir(filesPath);

              // 6. PDF Files (CC.pdf, etc.)
              for (const file of files.filter(f => f.endsWith('.pdf'))) {
                // Check the limit
                if (IMPORT_LIMIT > 0 && fileCount >= IMPORT_LIMIT) {
                  console.log(`🏁 Test complete: Reached limit of ${IMPORT_LIMIT} files.`);
                  return;
                }

                // Relative path for the database
                const relativePath = join(levelEntry.name, majorEntry.name, courseEntry.name, typeEntry.name, yearEntry.name, file);

                await prisma.pastExam.upsert({
                  where: { path: relativePath },
                  update: {},
                  create: {
                    path: relativePath,
                    year: parseInt(yearEntry.name) || 2024,
                    courseId: course.id,
                    examTypeId: examType.id
                  }
                });

                fileCount++;
                console.log(`✅ [${fileCount}] Imported: ${relativePath}`);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ Error during import process:', err);
  }
}

importExams()
  .then(() => {
    console.log('🌟 Seeding finished.');
    prisma.$disconnect();
  })
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
