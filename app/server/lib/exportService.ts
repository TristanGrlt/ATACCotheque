import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import prisma from "./prisma.js";
import { ExportStatus } from "@prisma/client";
import { rebuildExamsIndex } from "./searchIndexSync.js";

// Allowed join tables (implicit many-to-many) to include in backups
const RAW_TABLES = [
  "_CourseToParcours",
  "_CourseToExamType",
  "_LevelToParcours",
  "_MajorToParcours",
];

export const EXPORT_ROOT = process.env.EXPORT_DIR || path.resolve("export");
const FILES_ROOT = process.env.FILES_DIR || path.resolve("files");

type TableDumpConfig = {
  name: string;
  fetch: () => Promise<Record<string, unknown>[]>;
};

const TABLES: TableDumpConfig[] = [
  { name: "users", fetch: () => prisma.user.findMany() },
  { name: "roles", fetch: () => prisma.role.findMany() },
  { name: "user_roles", fetch: () => prisma.userRole.findMany() },
  { name: "majors", fetch: () => prisma.major.findMany() },
  { name: "levels", fetch: () => prisma.level.findMany() },
  { name: "parcours", fetch: () => prisma.parcours.findMany() },
  { name: "courses", fetch: () => prisma.course.findMany() },
  { name: "exam_types", fetch: () => prisma.examType.findMany() },
  { name: "past_exams", fetch: () => prisma.pastExam.findMany() },
  { name: "annexes", fetch: () => prisma.annexe.findMany() },
  {
    name: "webauthn_credentials",
    fetch: () => prisma.webAuthnCredential.findMany(),
  },
  {
    name: "webauthn_challenges",
    fetch: () => prisma.webAuthnChallenge.findMany(),
  },
  {
    name: "passkey_login_challenges",
    fetch: () => prisma.passkeyLoginChallenge.findMany(),
  },
];

const normalizeValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Uint8Array) return Buffer.from(value).toString("base64");
  if (Array.isArray(value) || typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
};

const toCsv = (rows: Record<string, unknown>[]): string => {
  if (!rows.length) return "";

  const headers = Object.keys(rows[0]);

  const escapeCsv = (raw: string) => {
    const needsQuotes = /[",\n]/.test(raw);
    const safe = raw.replace(/"/g, '""');
    return needsQuotes ? `"${safe}"` : safe;
  };

  const lines = [headers.join(",")];
  for (const row of rows) {
    const values = headers.map((header) =>
      escapeCsv(normalizeValue(row[header])),
    );
    lines.push(values.join(","));
  }

  return lines.join("\n");
};

const writeCsv = async (
  targetDir: string,
  table: TableDumpConfig,
): Promise<void> => {
  const rows = await table.fetch();
  const csv = toCsv(rows);
  const filePath = path.join(targetDir, `${table.name}.csv`);
  await fs.writeFile(filePath, csv, "utf8");
};

const writeRawTableCsv = async (targetDir: string, tableName: string) => {
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT * FROM "${tableName}"`,
  )) as Record<string, unknown>[];
  if (!rows || rows.length === 0) {
    await fs.writeFile(path.join(targetDir, `${tableName}.csv`), "", "utf8");
    return;
  }
  const csv = toCsv(rows);
  await fs.writeFile(path.join(targetDir, `${tableName}.csv`), csv, "utf8");
};

const copyFilesDirectory = async (destinationRoot: string) => {
  const destination = path.join(destinationRoot, "files");
  try {
    await fs.access(FILES_ROOT);
    await fs.cp(FILES_ROOT, destination, { recursive: true });
  } catch (error) {
    // Directory missing: still create the folder to keep archive structure predictable.
    await fs.mkdir(destination, { recursive: true });
  }
};

const createTarGz = (sourceDir: string, archivePath: string) => {
  return new Promise<void>((resolve, reject) => {
    const tar = spawn("tar", ["-czf", archivePath, "-C", sourceDir, "."]);

    tar.on("error", (err) => reject(err));

    tar.on("close", (code) => {
      if (code === 0) return resolve();
      return reject(new Error(`tar exited with code ${code ?? "unknown"}`));
    });
  });
};

const ensureNoRunningExport = async () => {
  const running = await prisma.exportJob.findFirst({
    where: { status: ExportStatus.RUNNING },
  });

  if (running) {
    const error = new Error("Un export est déjà en cours");
    // @ts-expect-error attach status for the controller to map
    error.statusCode = 409;
    throw error;
  }
};

const formatFilename = () => {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, "0");
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `export_${date}_${time}.tar.gz`;
};

export const listExportJobs = async () => {
  await syncExportsFromDisk();
  return prisma.exportJob.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const syncExportsFromDisk = async () => {
  await fs.mkdir(EXPORT_ROOT, { recursive: true });
  const files = await fs.readdir(EXPORT_ROOT);
  const archives = files.filter((file) => file.endsWith(".tar.gz"));

  for (const filename of archives) {
    const fullPath = path.join(EXPORT_ROOT, filename);
    const stats = await fs.stat(fullPath);
    const created = stats.mtime ?? new Date();

    await prisma.exportJob.upsert({
      where: { filename },
      create: {
        filename,
        status: ExportStatus.SUCCESS,
        sizeBytes: BigInt(stats.size),
        createdAt: created,
        completedAt: created,
      },
      update: {
        sizeBytes: BigInt(stats.size),
        status: ExportStatus.SUCCESS,
        completedAt: created,
      },
    });
  }
};

const runExportJob = async (
  jobId: number,
  filename: string,
  workingDir: string,
) => {
  try {
    await fs.mkdir(workingDir, { recursive: true });
    const dataDir = path.join(workingDir, "data");
    await fs.mkdir(dataDir, { recursive: true });

    for (const table of TABLES) {
      await writeCsv(dataDir, table);
    }

    for (const rawTable of RAW_TABLES) {
      await writeRawTableCsv(dataDir, rawTable);
    }

    await copyFilesDirectory(workingDir);

    const archivePath = path.join(EXPORT_ROOT, filename);
    await createTarGz(workingDir, archivePath);

    const { size } = await fs.stat(archivePath);

    await prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: ExportStatus.SUCCESS,
        sizeBytes: BigInt(size),
        completedAt: new Date(),
      },
    });
  } catch (error) {
    await prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: ExportStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : String(error),
        completedAt: new Date(),
      },
    });
    throw error;
  } finally {
    await fs.rm(workingDir, { recursive: true, force: true });
  }
};

export const generateFullExport = async () => {
  await ensureNoRunningExport();
  await fs.mkdir(EXPORT_ROOT, { recursive: true });

  const filename = formatFilename();
  const workingDir = path.join(EXPORT_ROOT, `job_${Date.now()}`);

  const job = await prisma.exportJob.create({
    data: {
      filename,
      status: ExportStatus.RUNNING,
    },
  });

  // Run in background to avoid client/proxy timeouts on long exports.
  runExportJob(job.id, filename, workingDir).catch((error) => {
    console.error("Export job failed:", error);
  });

  return job;
};

export const getExportFilePath = (filename: string) =>
  path.join(EXPORT_ROOT, filename);

// ----------------------------
// Import helpers
// ----------------------------

const parseCsvContent = (content: string): Record<string, string>[] => {
  if (!content.trim()) return [];
  const rows: string[][] = [];
  let current: string[] = [];
  let value = "";
  let inQuotes = false;

  const pushValue = () => {
    current.push(value);
    value = "";
  };

  const pushRow = () => {
    if (current.length === 0) return;
    rows.push(current);
    current = [];
  };

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (inQuotes) {
      if (char === '"') {
        if (content[i + 1] === '"') {
          value += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        value += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        pushValue();
      } else if (char === "\n") {
        pushValue();
        pushRow();
      } else if (char === "\r") {
        // ignore
      } else {
        value += char;
      }
    }
  }

  // flush last value/row
  pushValue();
  pushRow();

  if (rows.length === 0) return [];
  const [header, ...data] = rows;
  return data
    .filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""))
    .map((row) => {
      const obj: Record<string, string> = {};
      header.forEach((key, idx) => {
        obj[key] = row[idx] ?? "";
      });
      return obj;
    });
};

const readCsvFile = async (filePath: string) => {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return parseCsvContent(content);
  } catch (error: any) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
};

const asString = (value?: string) => value ?? "";
const asNullableString = (value?: string) => (value ? value : null);
const asBool = (value?: string) => value === "true" || value === "1";
const asInt = (value?: string) => (value ? Number(value) : 0);
const asIntOrNull = (value?: string) => (value ? Number(value) : null);
const asDateOrNull = (value?: string) => (value ? new Date(value) : null);
const asJsonArray = (value?: string) => {
  if (!value) return [] as unknown[];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const asBuffer = (value?: string) =>
  value ? Buffer.from(value, "base64") : Buffer.alloc(0);
const asBigInt = (value?: string) => (value ? BigInt(value) : BigInt(0));

let importLock = false;

const ensureNoImportRunning = () => {
  if (importLock) {
    const error = new Error("Une importation est déjà en cours");
    // @ts-expect-error attach status
    error.statusCode = 409;
    throw error;
  }
};

const acquireImportLock = () => {
  ensureNoImportRunning();
  importLock = true;
};

const releaseImportLock = () => {
  importLock = false;
};

const resetSequences = async (
  tx: Pick<typeof prisma, "$executeRawUnsafe">,
) => {
  const tables = [
    "Major",
    "Level",
    "Parcours",
    "Course",
    "ExamType",
    "PastExam",
    "Annexe",
  ];

  for (const table of tables) {
    await tx.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${table}"','id'), (SELECT COALESCE(MAX("id"),0) FROM "${table}") + 1, false);`,
    );
  }
};

const parseJoinRow = (row: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, asInt(value)]),
  );

const clearDirectory = async (dirPath: string) => {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
    return;
  } catch (error: any) {
    if (error?.code !== "EBUSY") throw error;
    // Fallback: delete children without removing the mount point
    await fs.mkdir(dirPath, { recursive: true });
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const target = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await fs.rm(target, { recursive: true, force: true });
      } else {
        await fs.rm(target, { force: true });
      }
    }
  }
};

export const restoreExportArchive = async (exportId: number) => {
  await syncExportsFromDisk();
  ensureNoImportRunning();
  await ensureNoRunningExport();

  const job = await prisma.exportJob.findUnique({ where: { id: exportId } });
  if (!job) {
    const error = new Error("Export introuvable");
    // @ts-expect-error attach status
    error.statusCode = 404;
    throw error;
  }

  const archivePath = getExportFilePath(job.filename);
  await fs.access(archivePath);

  const tempDir = await fs.mkdtemp(path.join(EXPORT_ROOT, "restore_"));
  const dataDir = path.join(tempDir, "data");
  const filesDir = path.join(tempDir, "files");

  const extract = () =>
    new Promise<void>((resolve, reject) => {
      const tar = spawn("tar", ["-xzf", archivePath, "-C", tempDir]);
      tar.on("error", reject);
      tar.on("close", (code) => {
        if (code === 0) return resolve();
        reject(new Error(`tar exited with code ${code ?? "unknown"}`));
      });
    });

  acquireImportLock();
  try {
    await extract();

    const [majors, levels, parcours, courses, examTypes] = await Promise.all([
      readCsvFile(path.join(dataDir, "majors.csv")),
      readCsvFile(path.join(dataDir, "levels.csv")),
      readCsvFile(path.join(dataDir, "parcours.csv")),
      readCsvFile(path.join(dataDir, "courses.csv")),
      readCsvFile(path.join(dataDir, "exam_types.csv")),
    ]);

    const [pastExams, annexes] = await Promise.all([
      readCsvFile(path.join(dataDir, "past_exams.csv")),
      readCsvFile(path.join(dataDir, "annexes.csv")),
    ]);

    const rawJoinTables = await Promise.all(
      RAW_TABLES.map(async (table) => ({
        table,
        rows: await readCsvFile(path.join(dataDir, `${table}.csv`)),
      })),
    );

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        'TRUNCATE TABLE "Major", "Level", "Parcours", "Course", "ExamType", "PastExam", "Annexe" RESTART IDENTITY CASCADE',
      );

      if (majors.length) {
        await tx.major.createMany({
          data: majors.map((m) => ({
            id: asInt(m.id),
            name: asString(m.name),
            icon: asString(m.icon),
          })),
        });
      }

      if (levels.length) {
        await tx.level.createMany({
          data: levels.map((l) => ({
            id: asInt(l.id),
            name: asString(l.name),
          })),
        });
      }

      if (parcours.length) {
        await tx.parcours.createMany({
          data: parcours.map((p) => ({
            id: asInt(p.id),
            name: asString(p.name),
          })),
        });
      }

      if (courses.length) {
        await tx.course.createMany({
          data: courses.map((c) => ({
            id: asInt(c.id),
            name: asString(c.name),
            aliases: asString(c.aliases ?? ""),
            semestre: asInt(c.semestre),
            levelId: asInt(c.levelId),
          })),
        });
      }

      if (examTypes.length) {
        await tx.examType.createMany({
          data: examTypes.map((e) => ({
            id: asInt(e.id),
            name: asString(e.name),
          })),
        });
      }

      for (const { table, rows } of rawJoinTables) {
        if (!rows.length) continue;
        const columns = Object.keys(rows[0]);
        const sanitizedCols = columns.map((col) =>
          col.replace(/[^A-Za-z0-9_]/g, ""),
        );
        const values = rows.map((r) =>
          sanitizedCols.map((c) => parseJoinRow(r)[c]),
        );
        for (const rowValues of values) {
          const colsSql = sanitizedCols.map((c) => `"${c}"`).join(",");
          const placeholders = rowValues
            .map((v) => (typeof v === "string" ? `'${v}'` : `${v}`))
            .join(",");
          await tx.$executeRawUnsafe(
            `INSERT INTO "${table}" (${colsSql}) VALUES (${placeholders})`,
          );
        }
      }

      if (pastExams.length) {
        await tx.pastExam.createMany({
          data: pastExams.map((pe) => ({
            id: asInt(pe.id),
            path: asString(pe.path),
            year: asInt(pe.year),
            courseId: asInt(pe.courseId),
            examTypeId: asInt(pe.examTypeId),
            isVerified: asBool(pe.isVerified),
          })),
        });
      }

      if (annexes.length) {
        await tx.annexe.createMany({
          data: annexes.map((a) => ({
            id: asInt(a.id),
            name: asString(a.name),
            type: asString(a.type) as any,
            path: asNullableString(a.path),
            url: asNullableString(a.url),
            pastExamId: asInt(a.pastExamId),
            isVerified: asBool(a.isVerified),
          })),
        });
      }

      await resetSequences(tx);
    });

    // Replace files directory (avoid EBUSY by clearing contents if needed)
    await clearDirectory(FILES_ROOT);
    try {
      await rebuildExamsIndex(prisma);
    } catch (error) {
      console.error("Meilisearch rebuild failed after import:", error);
    }
    try {
      await fs.access(filesDir);
      await fs.cp(filesDir, FILES_ROOT, { recursive: true });
    } catch {
      await fs.mkdir(FILES_ROOT, { recursive: true });
    }
  } finally {
    releaseImportLock();
    await fs.rm(tempDir, { recursive: true, force: true });
  }
};

export const registerUploadedArchive = async (
  storedPath: string,
  originalName: string,
) => {
  await syncExportsFromDisk();
  const stats = await fs.stat(storedPath);
  const filename = path.basename(storedPath);
  await prisma.exportJob.upsert({
    where: { filename },
    create: {
      filename,
      status: ExportStatus.SUCCESS,
      sizeBytes: BigInt(stats.size),
      createdAt: stats.mtime,
      completedAt: stats.mtime,
    },
    update: {
      sizeBytes: BigInt(stats.size),
      status: ExportStatus.SUCCESS,
      completedAt: stats.mtime,
    },
  });
  return { filename, originalName };
};
