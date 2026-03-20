import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { deleteCourseCascade } from "../utils/cascadeDelete.js";

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
    aliases = "",
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

  const rawAliases = aliases;
  if (typeof rawAliases !== "string" && typeof rawAliases !== "number") {
    return res.status(400).json({ error: "Les alias doivent être une chaîne" });
  }
  const normalizedAliases = rawAliases
    .toString()
    .split(",")
    .map((a) => a.trim())
    .filter((a) => a.length > 0)
    .join(",");

  try {
    const course = await prisma.course.create({
      data: {
        name: trimedName,
        aliases: normalizedAliases,
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
      aliases: course.aliases,
      semestre: course.semestre,
      levelId: course.levelId,
      parcoursIds: course.parcours.map((p) => p.id),
      examTypeIds: course.examTypes.map((e) => e.id),
    });
  } catch (error: any) {
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
    //    await prisma.course.delete({
    //      where: { id: parseInt(courseId, 10) },
    //    });
    await deleteCourseCascade(parseInt(courseId, 10));

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
  const { name, semestre, examTypeIds = [], aliases = "" } = req.body;

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

  const rawAliases = aliases;
  if (typeof rawAliases !== "string" && typeof rawAliases !== "number") {
    return res.status(400).json({ error: "Les alias doivent être une chaîne" });
  }
  const normalizedAliases = rawAliases
    .toString()
    .split(",")
    .map((a) => a.trim())
    .filter((a) => a.length > 0)
    .join(",");

  try {
    const course = await prisma.course.update({
      where: { id: parseInt(courseId, 10) },
      data: {
        name: trimedName,
        aliases: normalizedAliases,
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
      aliases: course.aliases,
      semestre: course.semestre,
      levelId: course.levelId,
      parcoursIds: course.parcours.map((p) => p.id),
      examTypeIds: course.examTypes.map((e) => e.id),
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour du cours" });
  }
};

export const getFullCourse = async (req: Request, res: Response) => {
  try {
    const result = await prisma.major.findMany({
      select: {
        name: true,
        parcours: {
          select: {
            name: true,
            courses: {
              select: {
                id: true,
                name: true,
                semestre: true,

                level: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return res.json(result);
  } catch (error) {
    console.error("Erreur lors de la récupération des cours:", error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
};
