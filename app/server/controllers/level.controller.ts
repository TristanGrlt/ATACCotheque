import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { deleteCourseCascade } from "../utils/cascadeDelete.js";

export const getLevel = async (req: Request, res: Response) => {
  try {
    const levels = await prisma.level.findMany({
      orderBy: { id: "asc" },
    });
    return res.status(200).json(levels);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erreur lors de la récupération des niveaux" });
  }
};

export const createLevel = async (req: Request, res: Response) => {
  const { name } = req.body;

  const trimedName = name?.trim();
  if (!trimedName) {
    return res.status(400).json({ error: "Le nom du niveau est obligatoire" });
  }

  try {
    const level = await prisma.level.create({
      data: { name: trimedName },
    });
    return res.status(201).json(level);
  } catch (error: any) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Un niveau avec ce nom existe déjà" });
    }
    return res
      .status(500)
      .json({ error: "Erreur lors de la création du niveau" });
  }
};

export const deleteLevel = async (req: Request, res: Response) => {
  const { levelId } = req.params;

  if (!levelId || Array.isArray(levelId)) {
    return res.status(400).json({ error: "ID du niveau manquant ou invalide" });
  }

  try {
    const courses = await prisma.course.findMany({
      where: { levelId: parseInt(levelId) },
      select: { id: true },
    });
    await Promise.all(courses.map((c) => deleteCourseCascade(c.id)));
    await prisma.level.delete({ where: { id: parseInt(levelId) } });

    return res.status(200).json({ message: "Le niveau a bien été supprimé" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erreur lors de la suppression du niveau" });
  }
};

export const updateLevel = async (
  req: Request<{ levelId: string }>,
  res: Response,
) => {
  const { levelId } = req.params;
  const { name } = req.body;

  if (!levelId || Array.isArray(levelId)) {
    return res.status(400).json({ error: "ID du niveau manquant ou invalide" });
  }

  const trimedName = name?.trim();
  if (!trimedName) {
    return res.status(400).json({ error: "Le nom du niveau est obligatoire" });
  }

  try {
    const updatedLevel = await prisma.level.update({
      where: { id: parseInt(levelId, 10) },
      data: { name: trimedName },
    });
    return res.status(200).json(updatedLevel);
  } catch (error: any) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Un niveau avec ce nom existe déjà" });
    }
    return res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour du niveau" });
  }
};
