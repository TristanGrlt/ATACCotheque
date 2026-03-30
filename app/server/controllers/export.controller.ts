import fs from "node:fs/promises";
import { Request, Response } from "express";
import { ExportStatus, type ExportJob } from "@prisma/client";
import prisma from "../lib/prisma.js";
import {
  generateFullExport,
  getExportFilePath,
  listExportJobs,
  registerUploadedArchive,
  restoreExportArchive,
} from "../lib/exportService.js";

const serializeJob = (job: ExportJob) => ({
  ...job,
  sizeBytes: job.sizeBytes ? Number(job.sizeBytes) : null,
});

export const listExports = async (_req: Request, res: Response) => {
  try {
    const exports = await listExportJobs();
    return res.status(200).json(exports.map(serializeJob));
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erreur lors de la récupération des exports" });
  }
};

export const triggerExport = async (_req: Request, res: Response) => {
  try {
    const job = await generateFullExport();
    return res.status(202).json(job ? serializeJob(job) : null);
  } catch (error: any) {
    const statusCode = error?.statusCode ?? 500;
    return res.status(statusCode).json({
      error: error?.message || "Erreur lors du lancement de l'export",
    });
  }
};

export const downloadExport = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Identifiant d'export invalide" });
  }

  const job = await prisma.exportJob.findUnique({ where: { id } });
  if (!job) {
    return res.status(404).json({ error: "Export introuvable" });
  }

  if (job.status !== ExportStatus.SUCCESS) {
    return res
      .status(409)
      .json({ error: "Cet export n'est pas encore disponible" });
  }

  const filePath = getExportFilePath(job.filename);

  try {
    await fs.access(filePath);
  } catch {
    return res.status(404).json({ error: "Fichier d'export introuvable" });
  }

  return res.download(filePath, job.filename);
};

export const importExport = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Identifiant d'export invalide" });
  }

  try {
    await restoreExportArchive(id);
    return res.status(200).json({ message: "Import terminé" });
  } catch (error: any) {
    const statusCode = error?.statusCode ?? 500;
    return res
      .status(statusCode)
      .json({ error: error?.message || "Erreur lors de l'import" });
  }
};

export const uploadExport = async (req: Request, res: Response) => {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) {
    return res.status(400).json({ error: "Aucun fichier reçu" });
  }

  try {
    await registerUploadedArchive(file.path, file.originalname);
    return res.status(201).json({ message: "Archive ajoutée" });
  } catch (error: any) {
    const statusCode = error?.statusCode ?? 500;
    return res
      .status(statusCode)
      .json({ error: error?.message || "Erreur lors de l'ajout de l'archive" });
  }
};
