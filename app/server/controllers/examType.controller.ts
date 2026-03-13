import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { deletePastExamWithFiles } from "../utils/cascadeDelete.js";

export const getExamType = async (req: Request, res: Response) => {
  try {
    const examTypes = await prisma.examType.findMany({
      orderBy: { id: "asc" },
    });
    return res.status(200).json(examTypes);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erreur lors de la récupération des types d'examen" });
  }
};

export const createExamType = async (req: Request, res: Response) => {
  const { name } = req.body;

  const trimedName = name?.trim();
  if (!trimedName) {
    return res
      .status(400)
      .json({ error: "Le nom du type d'examen est obligatoire" });
  }

  try {
    const examType = await prisma.examType.create({
      data: { name: trimedName },
    });
    return res.status(201).json(examType);
  } catch (error: any) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Un type d'examen avec ce nom existe déjà" });
    }
    return res
      .status(500)
      .json({ error: "Erreur lors de la création du type d'examen" });
  }
};

export const deleteExamType = async (req: Request, res: Response) => {
  const { examTypeId } = req.params;

  if (!examTypeId || Array.isArray(examTypeId)) {
    return res
      .status(400)
      .json({ error: "ID du type d'examen manquant ou invalide" });
  }

  try {
    const exams = await prisma.pastExam.findMany({
      where: { examTypeId: parseInt(examTypeId) },
      select: { id: true },
    });
    await Promise.all(exams.map((e) => deletePastExamWithFiles(e.id)));
    await prisma.examType.delete({ where: { id: parseInt(examTypeId) } });

    return res
      .status(200)
      .json({ message: "Le type d'examen a bien été supprimé" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erreur lors de la suppression du type d'examen" });
  }
};

export const updateExamType = async (
  req: Request<{ examTypeId: string }>,
  res: Response,
) => {
  const { examTypeId } = req.params;
  const { name } = req.body;

  if (!examTypeId || Array.isArray(examTypeId)) {
    return res
      .status(400)
      .json({ error: "ID du type d'examen manquant ou invalide" });
  }

  const trimedName = name?.trim();
  if (!trimedName) {
    return res
      .status(400)
      .json({ error: "Le nom du type d'examen est obligatoire" });
  }

  try {
    const updatedExamType = await prisma.examType.update({
      where: { id: parseInt(examTypeId, 10) },
      data: { name: trimedName },
    });
    return res.status(200).json(updatedExamType);
  } catch (error: any) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Un type d'examen avec ce nom existe déjà" });
    }
    return res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour du type d'examen" });
  }
};
