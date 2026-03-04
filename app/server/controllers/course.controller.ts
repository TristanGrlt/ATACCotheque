import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const getCourse = async (req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { id: "asc" },
      include: {
        parcours: {
          select: { id: true },
        },
        examTypes: {
          select: { id: true },
        },
      },
    });
    return res.status(200).json(
      courses.map((course) => ({
        id: course.id,
        name: course.name,
        semestre: course.semestre,
        levelId: course.levelId,
        parcoursIds: course.parcours.map((p) => p.id),
        examTypeIds: course.examTypes.map((e) => e.id),
      })),
    );
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erreur lors de la récupération des cours" });
  }
};

export const createCourse = async (req: Request, res: Response) => {
  const {
    name,
    semestre,
    levelId,
    parcoursIds = [],
    examTypeIds = [],
  } = req.body;

  const trimedName = name?.trim();
  if (!trimedName) {
    return res.status(400).json({ error: "Le nom du cours est obligatoire" });
  }

  if (!semestre || isNaN(semestre)) {
    return res.status(400).json({
      error: "Le semestre du cours est obligatoire et doit être un nombre",
    });
  }

  if (!levelId || isNaN(levelId)) {
    return res.status(400).json({
      error: "L'id du niveau du cours est obligatoire et doit être un nombre",
    });
  }

  try {
    const course = await prisma.course.create({
      data: {
        name: trimedName,
        semestre: parseInt(semestre, 10),
        levelId: parseInt(levelId, 10),
        parcours: {
          connect: parcoursIds.map((id: number) => ({ id })),
        },
        examTypes: {
          connect: examTypeIds.map((id: number) => ({ id })),
        },
      },
      include: {
        parcours: {
          select: { id: true },
        },
        examTypes: {
          select: { id: true },
        },
      },
    });
    return res.status(201).json({
      id: course.id,
      name: course.name,
      semestre: course.semestre,
      levelId: course.levelId,
      parcoursIds: course.parcours.map((p) => p.id),
      examTypeIds: course.examTypes.map((e) => e.id),
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Un cours avec ce nom existe déjà" });
    }
    return res
      .status(500)
      .json({ error: "Erreur lors de la création du cours" });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  const { courseId } = req.params;

  if (!courseId || Array.isArray(courseId)) {
    return res.status(400).json({ error: "ID du cours manquant ou invalide" });
  }

  try {
    await prisma.course.delete({
      where: { id: parseInt(courseId, 10) },
    });

    return res.status(200).json({ message: "Le cours a bien été supprimé" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erreur lors de la suppression du cours" });
  }
};

export const updateCourse = async (
  req: Request<{ courseId: string }>,
  res: Response,
) => {
  const { courseId } = req.params;
  const { name, semestre, examTypeIds = [] } = req.body;

  if (!courseId || Array.isArray(courseId)) {
    return res.status(400).json({ error: "ID du cours manquant ou invalide" });
  }

  const trimedName = name?.trim();
  if (!trimedName) {
    return res.status(400).json({ error: "Le nom du cours est obligatoire" });
  }

  if (!semestre || isNaN(semestre)) {
    return res.status(400).json({
      error: "Le semestre du cours est obligatoire et doit être un nombre",
    });
  }

  try {
    const course = await prisma.course.update({
      where: { id: parseInt(courseId, 10) },
      data: {
        name: trimedName,
        semestre: parseInt(semestre, 10),
        examTypes: {
          set: examTypeIds.map((id: number) => ({ id })),
        },
      },
      include: {
        parcours: {
          select: { id: true },
        },
        examTypes: {
          select: { id: true },
        },
      },
    });
    return res.status(200).json({
      id: course.id,
      name: course.name,
      semestre: course.semestre,
      levelId: course.levelId,
      parcoursIds: course.parcours.map((p) => p.id),
      examTypeIds: course.examTypes.map((e) => e.id),
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Un cours avec ce nom existe déjà" });
    }
    return res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour du cours" });
  }
};
