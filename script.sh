#!/bin/bash

EXAMS_ROOT="../files"
OUTPUT_FILE="app/server/prisma/final-import.ts"

echo "🚀 Generating robust single-line importer..."

cat <<EOF >$OUTPUT_FILE
import prisma from '../lib/prisma.js';

async function main() {
  console.log('🚀 Starting import...');
EOF

find "$EXAMS_ROOT" -type f | while read -r filepath; do
  # 1. Normalize path
  CLEAN_PATH=$(echo "$filepath" | sed 's|^\.\./files/content/||')
  IFS='/' read -ra ADDR <<<"$CLEAN_PATH"

  # Skip if path is too shallow to be valid
  [[ ${#ADDR[@]} -lt 3 ]] && continue

  # 2. Extract Base Metadata (Fixed positions)
  L="${ADDR[0]}"
  M="${ADDR[1]}"
  C="${ADDR[2]}"

  # 3. Search for Year and Type in the remaining folders
  YEAR="2024"
  TYPE="Examen"
  for part in "${ADDR[@]}"; do
    if [[ "$part" =~ ^(19|20)[0-9]{2}$ ]]; then
      YEAR="$part"
    elif [[ "$part" != "$L" && "$part" != "$M" && "$part" != "$C" && ! "$part" =~ \.pdf$ ]]; then
      # Ensure we don't grab trash/annexe filenames as the Type
      if [[ ! "$part" =~ (correction|corrige|annexe|annale|json|txt) ]]; then
        TYPE="$part"
      fi
    fi
  done

  FILENAME=$(basename "$filepath")

  # 4. Category Logic
  CATEGORY="PastExam"
  if [[ "$FILENAME" =~ (correction|corrige|Correction|Corrige|annexe|annale|json|txt) ]] || [[ ! "$FILENAME" =~ \.pdf$ ]]; then
    CATEGORY="Annexe"
  fi

  # Escape quotes for TS safety
  C_SAFE=$(echo "$C" | sed 's/"/\\"/g')
  T_SAFE=$(echo "$TYPE" | sed 's/"/\\"/g')

  echo "  await importItem({ category: \"$CATEGORY\", level: \"$L\", major: \"$M\", course: \"$C_SAFE\", semester: \"S1\", type: \"$T_SAFE\", year: $YEAR, path: \"$CLEAN_PATH\" });" >>$OUTPUT_FILE
done

cat <<EOF >>$OUTPUT_FILE
  console.log('✅ Import finished');
}

async function importItem(data: any) {
  try {
    const major = await prisma.major.upsert({ where: { name: data.major }, update: {}, create: { name: data.major } });
    const level = await prisma.level.findFirst({ where: { name: data.level, majorId: major.id } }) 
                  || await prisma.level.create({ data: { name: data.level, majorId: major.id } });
    const type = await prisma.examType.upsert({ where: { name: data.type }, update: {}, create: { name: data.type } });

    // FIX: Use findFirst + create/update instead of upsert on non-unique field
    let course = await prisma.course.findFirst({
      where: { name: data.course, LevelId: level.id }
    });

    if (course) {
      course = await prisma.course.update({
        where: { id: course.id },
        data: { 
          semestre: data.semester, 
          examType: { connect: { id: type.id } } 
        }
      });
    } else {
      course = await prisma.course.create({
        data: { 
          name: data.course, 
          semestre: data.semester, 
          LevelId: level.id, 
          examType: { connect: { id: type.id } } 
        }
      });
    }

    if (data.category === "Annexe") {
      await prisma.annexe.create({ data: { name: data.path.split('/').pop() || "File", type: 'FILE', isVerifed: false, path: data.path } });
    } else {
      await prisma.pastExam.upsert({
        where: { path: data.path },
        update: { year: data.year, courseId: course.id, examTypeId: type.id },
        create: { path: data.path, year: data.year, courseId: course.id, examTypeId: type.id }
      });
    }
  } catch (e) {
    console.error(\`❌ Failed to import \${data.path}:\`, e.message);
  }
}

main().then(() => prisma.\$disconnect());
EOF

echo "✨ Fixed! Now run ./script.sh then seed."
