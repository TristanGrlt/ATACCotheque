#!/usr/bin/env bash
set -euo pipefail

if [[ ${#} -lt 1 ]]; then
  echo "Usage: $0 <source-folder> [output.tar.gz]" >&2
  exit 1
fi

SRC_DIR=$(realpath "$1")
OUT_ARCHIVE=${2:-manual_import.tar.gz}
FILES_BASE=${FILES_BASE:-/app/files}

if [[ ! -d "$SRC_DIR" ]]; then
  echo "Source folder not found: $SRC_DIR" >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required" >&2
  exit 1
fi

WORK_DIR=$(mktemp -d "export_build.XXXXXX")
trap 'rm -rf "$WORK_DIR"' EXIT

echo "Building archive from: $SRC_DIR"
echo "Working directory:     $WORK_DIR"

data_dir="$WORK_DIR/data"
files_dir="$WORK_DIR/files"
mkdir -p "$data_dir" "$files_dir"

python3 - "$SRC_DIR" "$WORK_DIR" "$FILES_BASE" <<'PY'
import csv
import json
import os
import shutil
import sys
from datetime import datetime
from pathlib import Path

src = Path(sys.argv[1]).resolve()
work_dir = Path(sys.argv[2]).resolve()
files_base = sys.argv[3].rstrip("/")

data_dir = work_dir / "data"
files_dir = work_dir / "files"

data_dir.mkdir(parents=True, exist_ok=True)
files_dir.mkdir(parents=True, exist_ok=True)

counters = {
    "level": 1,
    "parcours": 1,
    "course": 1,
    "exam_type": 1,
    "past_exam": 1,
    "annexe": 1,
}

def next_id(key: str) -> int:
    value = counters[key]
    counters[key] += 1
    return value

def write_csv(path: Path, rows: list, headers: list | None = None):
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    if headers is None:
        headers = list(rows[0].keys())
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)

majors: list[dict] = []
levels: list[dict] = []
parcours: list[dict] = []
courses: list[dict] = []
exam_types: list[dict] = []
past_exams: list[dict] = []
annexes: list[dict] = []

course_to_parcours: set[tuple[int, int]] = set()
level_to_parcours: set[tuple[int, int]] = set()
course_to_examtype: set[tuple[int, int]] = set()
major_to_parcours: set[tuple[int, int]] = set()

level_map: dict[str, int] = {}
parcours_map: dict[str, int] = {}
course_map: dict[tuple[int, str], int] = {}
examtype_map: dict[str, int] = {}

pdf_exts = {".pdf"}
annexe_exts = {".pdf"}

for level_dir in sorted([p for p in src.iterdir() if p.is_dir()]):
    level_name = level_dir.name
    level_id = level_map.get(level_name)
    if level_id is None:
        level_id = next_id("level")
        level_map[level_name] = level_id
        levels.append({"id": level_id, "name": level_name})

    for parcours_dir in sorted([p for p in level_dir.iterdir() if p.is_dir()]):
        parcours_name = parcours_dir.name
        parcours_id = parcours_map.get(parcours_name)
        if parcours_id is None:
            parcours_id = next_id("parcours")
            parcours_map[parcours_name] = parcours_id
            parcours.append({"id": parcours_id, "name": parcours_name})
        level_to_parcours.add((level_id, parcours_id))

        for course_dir in sorted([p for p in parcours_dir.iterdir() if p.is_dir()]):
            course_key = (parcours_id, course_dir.name)
            course_id = course_map.get(course_key)
            if course_id is None:
                course_id = next_id("course")
                course_map[course_key] = course_id
                courses.append(
                    {
                        "id": course_id,
                        "name": course_dir.name,
                        "aliases": "",
                        "semestre": 1,
                        "levelId": level_id,
                    }
                )
            course_to_parcours.add((course_id, parcours_id))

            for examtype_dir in sorted([p for p in course_dir.iterdir() if p.is_dir()]):
                examtype_name = examtype_dir.name
                examtype_id = examtype_map.get(examtype_name)
                if examtype_id is None:
                    examtype_id = next_id("exam_type")
                    examtype_map[examtype_name] = examtype_id
                    exam_types.append({"id": examtype_id, "name": examtype_name})
                course_to_examtype.add((course_id, examtype_id))

                for year_dir in sorted([p for p in examtype_dir.iterdir() if p.is_dir()]):
                    try:
                        year_value = int(year_dir.name)
                    except ValueError:
                        continue

                    files_in_year = [f for f in year_dir.iterdir() if f.is_file()]
                    pdfs = [f for f in files_in_year if f.suffix.lower() in pdf_exts]
                    if not pdfs:
                        continue

                    main_pdf = None
                    for f in pdfs:
                        if f.name.lower() == "cc.pdf":
                            main_pdf = f
                            break
                    if main_pdf is None:
                        main_pdf = sorted(pdfs)[0]

                    rel_main = Path(str(course_id)) / str(examtype_id) / str(year_value) / main_pdf.name
                    dest_main = files_dir / rel_main
                    dest_main.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(main_pdf, dest_main)

                    past_exam_id = next_id("past_exam")
                    past_exams.append(
                        {
                            "id": past_exam_id,
                            "path": f"{files_base}/{rel_main.as_posix()}",
                            "year": year_value,
                            "courseId": course_id,
                            "examTypeId": examtype_id,
                            "isVerified": "true",
                        }
                    )

                    annex_candidates = [
                        f
                        for f in files_in_year
                        if f != main_pdf and f.suffix.lower() in annexe_exts
                    ]
                    for idx, ann in enumerate(sorted(annex_candidates)):
                        rel_ann = (
                            Path(str(course_id))
                            / str(examtype_id)
                            / str(year_value)
                            / f"annexe-{idx + 1}-{ann.name}"
                        )
                        dest_ann = files_dir / rel_ann
                        dest_ann.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(ann, dest_ann)
                        annexes.append(
                            {
                                "id": next_id("annexe"),
                                "name": ann.stem[:200],
                                "type": "FILE",
                                "path": f"{files_base}/{rel_ann.as_posix()}",
                                "url": "",
                                "pastExamId": past_exam_id,
                                "isVerified": "true",
                            }
                        )

course_to_parcours_rows = [
    {"A": a, "B": b} for a, b in sorted(course_to_parcours)
]
level_to_parcours_rows = [
    {"A": a, "B": b} for a, b in sorted(level_to_parcours)
]
course_to_examtype_rows = [
    {"A": a, "B": b} for a, b in sorted(course_to_examtype)
]
major_to_parcours_rows = [{"A": a, "B": b} for a, b in sorted(major_to_parcours)]

write_csv(data_dir / "majors.csv", majors, headers=["id", "name", "icon"])
write_csv(data_dir / "levels.csv", levels, headers=["id", "name"])
write_csv(data_dir / "parcours.csv", parcours, headers=["id", "name"])
write_csv(
    data_dir / "courses.csv",
    courses,
    headers=["id", "name", "aliases", "semestre", "levelId"],
)
write_csv(data_dir / "exam_types.csv", exam_types, headers=["id", "name"])
write_csv(
    data_dir / "past_exams.csv",
    past_exams,
    headers=["id", "path", "year", "courseId", "examTypeId", "isVerified"],
)
write_csv(
    data_dir / "annexes.csv",
    annexes,
    headers=["id", "name", "type", "path", "url", "pastExamId", "isVerified"],
)
write_csv(data_dir / "_CourseToParcours.csv", course_to_parcours_rows, headers=["A", "B"])
write_csv(data_dir / "_LevelToParcours.csv", level_to_parcours_rows, headers=["A", "B"])
write_csv(data_dir / "_CourseToExamType.csv", course_to_examtype_rows, headers=["A", "B"])
write_csv(data_dir / "_MajorToParcours.csv", major_to_parcours_rows, headers=["A", "B"])
write_csv(data_dir / "webauthn_credentials.csv", [])
write_csv(data_dir / "webauthn_challenges.csv", [])
write_csv(data_dir / "passkey_login_challenges.csv", [])

print("Summary:")
print(f"  Levels:       {len(levels)}")
print(f"  Parcours:     {len(parcours)}")
print(f"  Courses:      {len(courses)}")
print(f"  Exam types:   {len(exam_types)}")
print(f"  Past exams:   {len(past_exams)}")
print(f"  Annexes:      {len(annexes)}")
files_copied = sum(1 for p in files_dir.rglob('*') if p.is_file())
print(f"  Files copied: {files_copied}")
PY

tar -czf "$OUT_ARCHIVE" -C "$WORK_DIR" .

echo "Archive created: $OUT_ARCHIVE"
echo "Import it via the admin Import/Export page (upload then run restore)."
