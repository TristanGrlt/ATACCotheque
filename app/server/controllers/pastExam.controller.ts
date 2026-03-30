import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import {
  rebuildExamsIndex,
  removeExamDocument,
  upsertVerifiedExamDocument,
} from "../lib/searchIndexSync.js";

interface MulterRequest extends Request {
  files: {
    [key: string]: Express.Multer.File[];
  };
}
const uploadDir = process.env.UPLOAD_DIR || "/app/files";

async function recreatepdf(pdfBuffer: Buffer): Promise<Uint8Array> {
  const oldPdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  if (oldPdf.getPageCount() > 500) {
    throw new Error("PDF trop volumineux");
  }
  const newPdf = await PDFDocument.create();
  const pageIndices = oldPdf.getPageIndices();

  const copiedPages = await newPdf.copyPages(oldPdf, pageIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  const oldTitle = oldPdf.getTitle() || "";
  const oldAuthor = oldPdf.getAuthor() || "";
  newPdf.setTitle("Ataccothèque " + oldTitle);
  newPdf.setAuthor(oldAuthor);
  newPdf.setProducer("Générateur Sécurisé ataccothèque");

  return await newPdf.save();
}

export const uploadAllPastExam = async (req: Request, res: Response) => {
  try {
    const { courseId, examTypeId, year, annexes_metadata } = req.body;
    const files = (req as MulterRequest).files;

    if (!courseId || !examTypeId || !year) {
      return res.status(400).json({ message: "Les champs courseId, examTypeId et year sont obligatoires." });
    }

    const parsedCourseId = parseInt(courseId, 10);
    const parsedExamTypeId = parseInt(examTypeId, 10);
    const parsedYear = parseInt(year, 10);

    if (isNaN(parsedCourseId) || isNaN(parsedExamTypeId) || isNaN(parsedYear)) {
      return res.status(400).json({ message: "courseId, examTypeId et year doivent etre valides." });
    }

    if (!files || !files["file"] || files["file"].length === 0) {
      return res
        .status(400)
        .json({ message: "Le fichier principal est manquant (multipart/form-data attendu)." });
    }

    const mainFile = files["file"][0];


    const safeCourseId = parseInt(courseId).toString();
    if (isNaN(parseInt(courseId))) {
      return res.status(400).json({ message: "Erreur id cours" });
    }
    const courseDir = path.join(uploadDir, safeCourseId);
    if (!fs.existsSync(courseDir)) {
      fs.mkdirSync(courseDir, { recursive: true });
    }

    if (mainFile.mimetype !== "application/pdf") {
      return res
        .status(400)
        .json({ message: "Le fichier principal doit être un PDF." });
    }
    const magic = mainFile.buffer.slice(0, 4).toString("utf8");
    if (!magic.startsWith("%PDF")) {
      return res
        .status(400)
        .json({ message: "Le fichier n'est pas un PDF valide." });
    }

    const safeMainPdfBytes = await recreatepdf(mainFile.buffer);
    const mainFilename = `file-${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
    const mainFilePath = path.join(courseDir, mainFilename);
    let newPastExam;
    try {
      newPastExam = await prisma.pastExam.create({
        data: {
          path: mainFilePath,
          year: parseInt(year),
          courseId: parseInt(courseId),
          examTypeId: parseInt(examTypeId),
          isVerified: false,
        },
      });
      fs.writeFileSync(mainFilePath, safeMainPdfBytes);
    } catch (e) {
      if (fs.existsSync(mainFilePath)) fs.unlinkSync(mainFilePath);
      throw e;
    }
    let annexesList: any[] = [];
    if (annexes_metadata) {
      try {
        annexesList = JSON.parse(annexes_metadata);
      } catch (e) {
        return res
          .status(400)
          .json({ message: "Format des annexes invalide." });
      }
    }

    for (const annexe of annexesList) {
      if (annexe.type === "url" && annexe.url) {
        try {
          const allowedUrl = new URL(annexe.url);

          if (!["http:", "https:"].includes(allowedUrl.protocol)) {
            return res.status(400).json({ message: "URL non autorisée." });
          }
        } catch (e) {
          return res.status(400).json({ message: "Format de l'URL invalide." });
        }
        await prisma.annexe.create({
          data: {
            name: annexe.comment?.slice(0, 200) || "Lien externe",
            type: "URL",
            url: annexe.url,
            pastExamId: newPastExam.id,
          },
        });
      } else if (annexe.type === "fichier" && annexe.fileKey) {
        const annexeFileArray = files[annexe.fileKey];

        if (annexeFileArray && annexeFileArray.length > 0) {
          const annexeFile = annexeFileArray[0];
          const magic = annexeFile.buffer.slice(0, 4).toString("utf8");
          if (!magic.startsWith("%PDF")) {
            return res
              .status(400)
              .json({ message: "Le fichier n'est pas un PDF valide." });
          }
          if (annexeFile.mimetype === "application/pdf") {
            const safeOptPdfBytes = await recreatepdf(annexeFile.buffer);
            const optFilename = `annexe-${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
            const optionalFilePath = path.join(uploadDir, optFilename);
            fs.writeFileSync(optionalFilePath, safeOptPdfBytes);

            await prisma.annexe.create({
              data: {
                name: annexe.comment?.slice(0, 200) || "Document annexe",
                type: "FILE",
                path: optionalFilePath,
                pastExamId: newPastExam.id,
              },
            });
          }
        }
      }
    }

    return res
      .status(201)
      .json({ message: "Annale uploadée avec succès", data: newPastExam });
  } catch (error) {
    console.error("Erreur lors de l'upload ou du nettoyage :", error);
    return res.status(500).json({
      message:
        "Erreur lors du traitement du fichier. Veuillez vérifier qu'il s'agit d'un PDF valide.",
    });
  }
};
export const getPastExamToReview = async (req: Request, res: Response) => {
  try {
    const result = await prisma.pastExam.findMany({
      select: {
        id: true,
        year: true,
        course: {
          select: {
            name: true,
            parcours: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      where: {
        OR: [
          { isVerified: false },
          {
            annexe: {
              some: {
                isVerified: false,
              },
            },
          },
        ],
      },
      distinct: ["id"],
    });

    const simplified = result.map(({ course, ...exam }) => ({
      ...exam,
      courseName: course.name,
      parcours: course.parcours.map((p) => p.name),
    }));

    return res.json(simplified);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des examens en attente",
      error,
    );
    return res
      .status(500)
      .json({ error: "Erreur lors de la récupération des examens en attente" });
  }
};

const EXAMS_ROOT = "/app/files";

function normalizeDbFilePath(dbPath: string): string {
  const rawPath = dbPath.trim();

  // Keep absolute paths unchanged (e.g. /app/files/...).
  if (path.isAbsolute(rawPath)) {
    return path.normalize(rawPath);
  }

  // Migrate legacy relative storage formats.
  if (rawPath === "../files" || rawPath === "files") {
    return EXAMS_ROOT;
  }

  if (rawPath.startsWith("../files/")) {
    return path.join(EXAMS_ROOT, rawPath.slice("../files/".length));
  }

  if (rawPath.startsWith("files/")) {
    return path.join(EXAMS_ROOT, rawPath.slice("files/".length));
  }

  // Last resort: keep path anchored under EXAMS_ROOT.
  return path.join(EXAMS_ROOT, rawPath);
}

export const getFileInvalid = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: "Id manquant ou invalide" });
    }
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "Id manquant ou invalide" });
    }

    const result = await prisma.pastExam.findUnique({
      select: {
        id: true,
        path: true,
        year: true,
        isVerified: true,
        examtype: { select: { name: true } },
        course: { select: { name: true } },
      },
      where: { id: parsedId },
    });

    if (!result) {
      return res.status(404).json({ error: "Fichier introuvable" });
    }

    const courseName = result.course?.name ?? "inconnu";
    const examType = result.examtype?.name ?? "inconnu";
    // ... (le début de ta fonction reste identique jusqu'à la définition du downloadName)
    const downloadName = `Ataccothèque_${courseName}_${examType}_${result.year}.pdf`;

    // 1. Nettoyer le chemin issu de la BDD (ex: "files/3/file-123.pdf")
    let dbPath = result.path;
    if (dbPath.startsWith("../files")) {
      dbPath = dbPath.replace("../files", "files");
    }

    // 2. Créer le chemin absolu réel pour le conteneur (ex: "/app/files/3/file-123.pdf")
    const realPath = path.resolve(process.cwd(), dbPath);
    const EXAMS_ROOT = path.resolve(process.cwd(), "files"); // "/app/files"

    // Protection path traversal
    if (!realPath.startsWith(EXAMS_ROOT)) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    res.setHeader("Content-Disposition", `inline; filename="${downloadName}"`);

    if (process.env.NODE_ENV === "production") {
      // 3. Extraire le chemin relatif pour Nginx (ex: "/files/3/file-123.pdf")
      // process.cwd() vaut "/app", on l'enlève de la chaîne
      const nginxPath = realPath.replace(process.cwd(), "");

      res.setHeader("X-Accel-Redirect", nginxPath);
      res.end();
    } else {
      res.sendFile(realPath, (err) => {
        if (err) {
          console.error("Erreur de téléchargement en dev:", err);
          if (!res.headersSent) res.status(500).send("Erreur de fichier");
        }
      });
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du fichier:", error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la récupération du fichier" });
  }
};

export const getExamById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Id manquant ou invalide" });
  }
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) {
    return res.status(400).json({ error: "Id manquant ou invalide" });
  }

  const result = await prisma.pastExam.findUnique({
    select: {
      id: true,
      isVerified: true,
      year: true,
      examtype: { select: { id: true } },
      course: { select: { id: true } },
    },
    where: { id: parsedId },
  });
  if (!result) {
    return res.status(404).json({ erreur: "id invalide" });
  }

  return res.json(result);
};

export const getAnnexeById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Id manquant ou invalide" });
  }
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) {
    return res.status(400).json({ error: "Id manquant ou invalide" });
  }

  const result = await prisma.annexe.findMany({
    where: {
      pastExamId: parsedId,
    },
    select: {
      id: true,
      name: true,
      type: true,
      url: true,
      isVerified: true,
    },
  });

  return res.json(result);
};

async function serveAnnexeFile(
  res: Response,
  annexeId: number,
  requireVerified: boolean = false
) {
  const result = await prisma.annexe.findUnique({
    select: {
      id: true,
      path: true,
      name: true,
      ...(requireVerified && { isVerified: true }),
    },
    where: { id: annexeId },
  });

  if (!result || (requireVerified && !result.isVerified)) {
    return res.status(404).json({ error: "Fichier introuvable" });
  }

  if (!result.path) {
    return res.status(404).json({ error: "Fichier introuvable" });
  }

  const downloadName = `Ataccothèque_annexe${result.id}.pdf`;
  
  // Protection path traversal
  const normalizedDbPath = normalizeDbFilePath(result.path);
  const realPath = path.resolve(normalizedDbPath);
  if (!realPath.startsWith(path.resolve(EXAMS_ROOT))) {
    return res.status(403).json({ error: "Accès non autorisé" });
  }

  res.setHeader("Content-Disposition", `inline; filename="${downloadName}"`);

  if (process.env.NODE_ENV === "production") {
    // Nginx is configured with internal location /files mapped to /app/files.
    const nginxPath = realPath.replace(EXAMS_ROOT, "/files");
    res.setHeader("X-Accel-Redirect", nginxPath);
    res.end();
  } else {
    res.sendFile(realPath, (err) => {
      if (err) {
        console.error("Erreur de téléchargement en dev:", err);
        if (!res.headersSent) res.status(500).send("Erreur de fichier");
      }
    });
  }
}

export const getAnnexeFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: "Id manquant ou invalide" });
    }
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "Id manquant ou invalide" });
    }

    await serveAnnexeFile(res, parsedId, false);
  } catch (error) {
    console.error("Erreur lors de la récupération du fichier:", error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la récupération du fichier" });
  }
};

export const getPublicAnnexeFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: "Id manquant ou invalide" });
    }
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "Id manquant ou invalide" });
    }

    await serveAnnexeFile(res, parsedId, true);
  } catch (error) {
    console.error("Erreur lors de la récupération du fichier public:", error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la récupération du fichier" });
  }
};

export const updateAnnale = async (req: Request, res: Response) => {
  try {
    const { examId, courseId, examTypeId, year, annexes_metadata } = req.body;
    const files = (req as MulterRequest).files;
    const parsedExamId = parseInt(examId);

    const existingExam = await prisma.pastExam.findUnique({
      where: { id: parsedExamId },
      include: { annexe: true },
    });

    if (!existingExam) {
      return res.status(404).json({ message: "Annale introuvable." });
    }

    let mainFilePath = existingExam.path;

    if (files && files["file"] && files["file"].length > 0) {
      const mainFile = files["file"][0];

      if (!fs.existsSync(uploadDir))
        fs.mkdirSync(uploadDir, { recursive: true });
      const safeCourseId = parseInt(courseId).toString();
      if (isNaN(parseInt(courseId))) {
        return res.status(400).json({ message: "Erreur id cours" });
      }
      const courseDir = path.join(uploadDir, safeCourseId);
      if (!fs.existsSync(courseDir))
        fs.mkdirSync(courseDir, { recursive: true });

      if (
        mainFile.mimetype !== "application/pdf" ||
        !mainFile.buffer.slice(0, 4).toString("utf8").startsWith("%PDF")
      ) {
        return res
          .status(400)
          .json({ message: "Le fichier principal n'est pas un PDF valide." });
      }

      if (mainFilePath && fs.existsSync(mainFilePath)) {
        fs.unlinkSync(mainFilePath);
      }

      const safeMainPdfBytes = await recreatepdf(mainFile.buffer);
      const mainFilename = `file-${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
      mainFilePath = path.join(courseDir, mainFilename);
      fs.writeFileSync(mainFilePath, safeMainPdfBytes);
    }

    await prisma.pastExam.update({
      where: { id: parsedExamId },
      data: {
        path: mainFilePath,
        year: parseInt(year),
        courseId: parseInt(courseId),
        examTypeId: parseInt(examTypeId),
        isVerified: true,
      },
    });

    let annexesList: any[] = [];
    if (annexes_metadata) {
      try {
        annexesList = JSON.parse(annexes_metadata);
      } catch (e) {
        return res
          .status(400)
          .json({ message: "Format des annexes invalide." });
      }
    }

    const incomingIds = annexesList
      .map((a: any) => a.id)
      .filter(Boolean)
      .map(Number);

    for (const oldAnnexe of existingExam.annexe) {
      if (!incomingIds.includes(oldAnnexe.id)) {
        if (
          oldAnnexe.type === "FILE" &&
          oldAnnexe.path &&
          fs.existsSync(oldAnnexe.path)
        ) {
          fs.unlinkSync(oldAnnexe.path);
        }
        await prisma.annexe.delete({ where: { id: oldAnnexe.id } });
      }
    }

    for (const annexe of annexesList) {
      if (annexe.id) {
        const annexeId = parseInt(annexe.id);
        const oldAnnexe = existingExam.annexe.find((a) => a.id === annexeId);

        if (annexe.type === "URL") {
          if (
            oldAnnexe?.type === "FILE" &&
            oldAnnexe.path &&
            fs.existsSync(oldAnnexe.path)
          ) {
            fs.unlinkSync(oldAnnexe.path);
          }
          try {
            const allowedUrl = new URL(annexe.url);

            if (!["http:", "https:"].includes(allowedUrl.protocol)) {
              return res.status(400).json({ message: "URL non autorisée." });
            }
          } catch (e) {
            return res
              .status(400)
              .json({ message: "Format de l'URL invalide." });
          }
          await prisma.annexe.update({
            where: { id: annexeId },
            data: {
              name: annexe.comment?.slice(0, 200) || "Lien externe",
              type: "URL",
              url: annexe.url,
              path: null,
              isVerified: true,
            },
          });
        } else if (annexe.type === "FILE") {
          if (
            annexe.fileKey &&
            files[annexe.fileKey] &&
            files[annexe.fileKey].length > 0
          ) {
            if (
              oldAnnexe?.type === "FILE" &&
              oldAnnexe.path &&
              fs.existsSync(oldAnnexe.path)
            ) {
              fs.unlinkSync(oldAnnexe.path);
            }
            const annexeFile = files[annexe.fileKey][0];
            const safeOptPdfBytes = await recreatepdf(annexeFile.buffer);
            const optFilename = `annexe-${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
            const optionalFilePath = path.join(uploadDir, optFilename);
            fs.writeFileSync(optionalFilePath, safeOptPdfBytes);

            await prisma.annexe.update({
              where: { id: annexeId },
              data: {
                name: annexe.comment?.slice(0, 200) || "Document annexe",
                type: "FILE",
                path: optionalFilePath,
                url: null,
                isVerified: true,
              },
            });
          } else {
            await prisma.annexe.update({
              where: { id: annexeId },
              data: {
                name: annexe.comment?.slice(0, 200) || "Document annexe",
                isVerified: true,
              },
            });
          }
        }
      } else {
        if (annexe.type === "URL" && annexe.url) {
          try {
            const allowedUrl = new URL(annexe.url);

            if (!["http:", "https:"].includes(allowedUrl.protocol)) {
              return res.status(400).json({ message: "URL non autorisée." });
            }
          } catch (e) {
            return res
              .status(400)
              .json({ message: "Format de l'URL invalide." });
          }
          await prisma.annexe.create({
            data: {
              name: annexe.comment?.slice(0, 200) || "Lien externe",
              type: "URL",
              url: annexe.url,
              pastExamId: parsedExamId,
              isVerified: true,
            },
          });
        } else if (
          annexe.type === "FILE" &&
          annexe.fileKey &&
          files[annexe.fileKey] &&
          files[annexe.fileKey].length > 0
        ) {
          const annexeFile = files[annexe.fileKey][0];
          const safeOptPdfBytes = await recreatepdf(annexeFile.buffer);
          const optFilename = `annexe-${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
          const optionalFilePath = path.join(uploadDir, optFilename);
          fs.writeFileSync(optionalFilePath, safeOptPdfBytes);

          await prisma.annexe.create({
            data: {
              name: annexe.comment?.slice(0, 200) || "Document annexe",
              type: "FILE",
              path: optionalFilePath,
              pastExamId: parsedExamId,
              isVerified: true,
            },
          });
        }
      }
    }
    await upsertVerifiedExamDocument(prisma, parsedExamId);

    return res.status(200).json({ message: "Annale validée et indexée avec succès" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

export const deletePastExam = async (req: Request, res: Response) => {
  try {
    if (!req.params.id || Array.isArray(req.params.id)) {
      return res.status(400).json({ error: "Id manquant ou invalide" });
    }
    const examId = parseInt(req.params.id);
    if (isNaN(examId)) {
      return res.status(400).json({ error: "Id invalide" });
    }

    const existingExam = await prisma.pastExam.findUnique({
      where: { id: examId },
      include: { annexe: true },
    });

    if (!existingExam) {
      return res.status(404).json({ error: "Annale introuvable" });
    }

    await prisma.annexe.deleteMany({
      where: { pastExamId: examId },
    });

    await prisma.pastExam.delete({
      where: { id: examId },
    });

    res.status(200).json({ message: "Annale supprimée avec succès" });

    const safeDeleteFile = (filePath: string | null) => {
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fsError) {
          console.warn(
            `Impossible de supprimer le fichier ${filePath} :`,
            fsError,
          );
        }
      }
    };

    safeDeleteFile(existingExam.path);
    for (const annexe of existingExam.annexe) {
      if (annexe.type === "FILE") {
        safeDeleteFile(annexe.path);
      }
    }
    await removeExamDocument(examId);
  } catch (error) {
    console.error("====== ERREUR LORS DE LA SUPPRESSION ======");
    console.error(error);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ error: "Erreur serveur lors de la suppression" });
    }
  }
};

export const rebuildSearchIndex = async (_req: Request, res: Response) => {
  try {
    await rebuildExamsIndex(prisma);
    return res.status(200).json({ message: "Index Meilisearch resynchronisé avec succes" });
  } catch (error) {
    console.error("Erreur lors de la reconstruction de l'index:", error);
    return res.status(500).json({ error: "Erreur serveur lors de la reconstruction de l'index" });
  }
};

/**
 * Route: GET /api/pastExams/public/:id
 * Purpose: Fetch deep details for the frontend (Search result click)
 */
export const getPublicExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: "Id manquant ou invalide" });
    }

    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "Id invalide" });
    }

    const exam = await prisma.pastExam.findUnique({
      where: {
        id: parsedId,
        isVerified: true // SECURITY: Only return if validated
      },
      select: {
        id: true,
        year: true,
        examtype: {
          select: { id: true, name: true }
        },
        annexe: {
          where: { isVerified: true },
          select: {
            id: true,
            name: true,
            type: true,
            url: true,
          }
        },
        course: {
          select: {
            id: true,
            name: true,
            level: { select: { id: true, name: true } },
            parcours: {
              select: {
                id: true,
                name: true,
                majors: { select: { id: true, name: true, icon: true } }
              }
            }
          }
        }
      }
    });

    if (!exam) return res.status(404).json({ error: "Annale introuvable ou non vérifiée" });

    return res.json(exam);
  } catch (err) {
    console.error("Erreur getPublicExam:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * Route: GET /api/pastExams/public/:id/file
 * Purpose: Serve the PDF securely to users
 */
export const getPublicFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: "Id manquant ou invalide" });
    }

    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "Id invalide" });
    }
    if (isNaN(parsedId)) return res.status(400).json({ error: "Id invalide" });

    const exam = await prisma.pastExam.findUnique({
      where: {
        id: parsedId,
        isVerified: true // SECURITY: Only serve validated files
      },
      select: { path: true, year: true, course: { select: { name: true } } }
    });

    if (!exam) return res.status(404).json({ error: "Fichier introuvable" });

    // Path resolution
    const normalizedDbPath = normalizeDbFilePath(exam.path);
    const realPath = path.resolve(normalizedDbPath);

    if (!realPath.startsWith(path.resolve(EXAMS_ROOT))) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    const downloadName = `Ataccothèque_${exam.course.name}_${exam.year}.pdf`;
    res.setHeader("Content-Disposition", `inline; filename="${downloadName}"`);

    // Use the optimized Nginx/Express send method like in getFileInvalid
    if (process.env.NODE_ENV === "production") {
      const nginxPath = realPath.replace(EXAMS_ROOT, "/files");
      res.setHeader("X-Accel-Redirect", nginxPath);
      res.end();
    } else {
      res.sendFile(realPath, (err) => {
        if (err && !res.headersSent) res.status(500).send("Erreur de fichier");
      });
    }
  } catch (err) {
    console.error("Erreur getPublicFile:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};
export const getAllPastExams = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const search = (req.query.search as string) || "";
    const sortBy = (req.query.sortBy as string) || "id";
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';
    const skip = (page - 1) * pageSize;

    const whereClause = search ? {
      OR: [
        { course: { name: { contains: search, mode: 'insensitive' as const } } },
        { examtype: { name: { contains: search, mode: 'insensitive' as const } } }
      ]
    } : {};

    // Map frontend field names to Prisma fields
    const sortFieldMap: Record<string, any> = {
      year: { year: sortOrder },
      major: { course: { parcours: { majors: { name: sortOrder } } } },
      level: { course: { level: { name: sortOrder } } },
      type: { examtype: { name: sortOrder } },
      course: { course: { name: sortOrder } },
      annexes: { annexe: { _count: sortOrder } },
      id: { id: sortOrder },
    };

    const orderBy = sortFieldMap[sortBy] || { id: sortOrder };

    const [totalCount, exams] = await Promise.all([
      prisma.pastExam.count({ where: whereClause }),
      prisma.pastExam.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        select: {
          id: true,
          year: true,
          path: true,
          isVerified: true,
          examtype: {
            select: { name: true }
          },
          course: {
            select: {
              name: true,
              level: { select: { name: true } },
              parcours: { 
                select: { 
                  majors: { select: { name: true } } 
                }
              }
            }
          },
          annexe: true,
        },
        orderBy
      })
    ]);

    const formattedExams = exams.map((exam) => {
      const allMajors = exam.course?.parcours?.flatMap((parcours) => parcours.majors) || [];
      const uniqueMajorNames = [...new Set(allMajors.map((major) => major.name))];

      return {
        id: exam.id,
        course: exam.course?.name || 'Inconnu',
        type: exam.examtype?.name || 'Inconnu',
        level: exam.course?.level?.name || 'Inconnu',
        major: uniqueMajorNames.join(', ') || 'Non défini',
        year: exam.year,
        path: exam.path,
        isVerified: exam.isVerified,
        annexeCount: exam.annexe?.length || 0
      };
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    return res.json({
      data: formattedExams,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error("Erreur getAllPastExams:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

