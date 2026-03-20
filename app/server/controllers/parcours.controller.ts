import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { updateCourse } from "./course.controller.js";
import { deleteCourseCascade } from "../utils/cascadeDelete.js";

export const getParcours = async (req: Request, res: Response) => {
  try {
    const parcours = await prisma.parcours.findMany({
      orderBy: { id: "asc" },
      include: {
        majors: {
          select: {
            id: true,
          },
        },
      },
    });
    const formatted = parcours.map((p) => ({
      id: p.id,
      name: p.name,
      majorIds: p.majors.map((m) => m.id),
    }));
    return res.status(200).json(formatted);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erreur lors de la récupération des parcours" });
  }
};

export const createParcours = async (req: Request, res: Response) => {
  const { name, majorIds = [] } = req.body;

  const trimedName = name?.trim();
  if (!trimedName) {
    return res
      .status(400)
      .json({ error: "Le nom du parcours est obligatoire" });
  }

  try {
    const parcours = await prisma.parcours.create({
      data: {
        name: trimedName,
        majors: {
          connect: majorIds.map((id: number) => ({ id })),
        },
      },
      include: {
        majors: {
          select: { id: true },
        },
      },
    });
    return res.status(201).json({
      id: parcours.id,
      name: parcours.name,
      majorIds: parcours.majors.map((m) => m.id),
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Un parcours avec ce nom existe déjà" });
    }
    return res
      .status(500)
      .json({ error: "Erreur lors de la création du parcours" });
  }
};

export const deleteParcours = async (req: Request, res: Response) => {
  const { parcoursId } = req.params;

  if (!parcoursId || Array.isArray(parcoursId)) {
    return res
      .status(400)
      .json({ error: "ID du parcours manquant ou invalide" });
  }

  try {
    const exclusifCourses = await prisma.course.findMany({
      where: {
        parcours: { some: { id: parseInt(parcoursId, 10) } },
        NOT: {
          parcours: { some: { id: { not: parseInt(parcoursId, 10) } } },
        },
      },
      select: { id: true },
    });
    await Promise.all(exclusifCourses.map((c) => deleteCourseCascade(c.id)));
    await prisma.parcours.delete({ where: { id: parseInt(parcoursId, 10) } });

    return res.status(200).json({ message: "Le parcours a bien été supprimé" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erreur lors de la suppression du parcours" });
  }
};

export const updateParcours = async (req: Request, res: Response) => {
  const { parcoursId } = req.params;
  const { name, majorIds = [] } = req.body;

  if (!parcoursId || Array.isArray(parcoursId)) {
    return res
      .status(400)
      .json({ error: "ID du parcours manquant ou invalide" });
  }

  const trimedName = name?.trim();
  if (!trimedName) {
    return res
      .status(400)
      .json({ error: "Le nom du parcours est obligatoire" });
  }

  try {
    const updatedParcours = await prisma.parcours.update({
      where: { id: parseInt(parcoursId, 10) },
      data: {
        name: trimedName,
        majors: {
          set: majorIds.map((id: number) => ({ id })),
        },
      },
      include: {
        majors: {
          select: { id: true },
        },
      },
    });
    return res.status(200).json({
      id: updatedParcours.id,
      name: updatedParcours.name,
      majorIds: updatedParcours.majors.map((m) => m.id),
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Un parcours avec ce nom existe déjà" });
    }
    return res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour du parcours" });
  }
};

export const addLevelToParcours = async (req: Request, res: Response) => {
  const { parcoursId, levelId } = req.params;
  if (
    !parcoursId ||
    Array.isArray(parcoursId) ||
    !levelId ||
    Array.isArray(levelId)
  ) {
    return res
      .status(400)
      .json({ error: "ID du parcours ou du niveau manquant ou invalide" });
  }

  try {
    const updatedParcours = await prisma.parcours.update({
      where: { id: parseInt(parcoursId, 10) },
      data: { levels: { connect: { id: parseInt(levelId, 10) } } },
      include: {
        levels: {
          select: { id: true, name: true },
        },
      },
    });
    return res.status(200).json(updatedParcours.levels);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erreur lors de l'ajout du niveau au parcours" });
  }
};

export const removeLevelFromParcours = async (req: Request, res: Response) => {
  const { parcoursId, levelId } = req.params;
  if (
    !parcoursId ||
    Array.isArray(parcoursId) ||
    !levelId ||
    Array.isArray(levelId)
  ) {
    return res
      .status(400)
      .json({ error: "ID du parcours ou du niveau manquant ou invalide" });
  }

  try {
    const orphanCourses = await prisma.course.findMany({
      where: {
        levelId: parseInt(levelId, 10),
        parcours: { some: { id: parseInt(parcoursId, 10) } },
        NOT: { parcours: { some: { id: { not: parseInt(parcoursId, 10) } } } },
      },
      select: { id: true },
    });
    await Promise.all(orphanCourses.map((c) => deleteCourseCascade(c.id)));

    const updatedParcours = await prisma.parcours.update({
      where: { id: parseInt(parcoursId, 10) },
      data: { levels: { disconnect: { id: parseInt(levelId, 10) } } },
      include: {
        levels: {
          select: { id: true, name: true },
        },
      },
    });
    return res.status(200).json(updatedParcours.levels);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erreur lors de la suppression du niveau du parcours" });
  }
};

export const getParcoursLevels = async (req: Request, res: Response) => {
  const { parcoursId } = req.params;

  if (!parcoursId || Array.isArray(parcoursId)) {
    return res
      .status(400)
      .json({ error: "ID du parcours manquant ou invalide" });
  }

  try {
    const levels = await prisma.parcours.findUnique({
      where: { id: parseInt(parcoursId, 10) },
      select: { levels: true },
    });
    return res.status(200).json(levels?.levels || []);
  } catch (error) {
    return res.status(500).json({
      error: "Erreur lors de la récupération des niveaux du parcours",
    });
  }
};

export const getParcoursLevelsCourses = async (req: Request, res: Response) => {
  const { parcoursId, levelId } = req.params;

  if (
    !parcoursId ||
    Array.isArray(parcoursId) ||
    !levelId ||
    Array.isArray(levelId)
  ) {
    return res
      .status(400)
      .json({ error: "ID du parcours ou du niveau manquant ou invalide" });
  }

  try {
    const courses = await prisma.course.findMany({
      where: {
        levelId: parseInt(levelId, 10),
        parcours: { some: { id: parseInt(parcoursId, 10) } },
      },
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
        aliases: course.aliases,
        semestre: course.semestre,
        levelId: course.levelId,
        parcoursIds: course.parcours.map((p) => p.id),
        examTypeIds: course.examTypes.map((e) => e.id),
      })),
    );
  } catch (error) {
    return res.status(500).json({
      error: "Erreur lors de la récupération des cours du niveau et parcours",
    });
  }
};

export const connectCourseToParcoursLevels = async (
  req: Request,
  res: Response,
) => {
  const { parcoursId, levelId, courseId } = req.params;

  if (
    !parcoursId ||
    Array.isArray(parcoursId) ||
    !levelId ||
    Array.isArray(levelId) ||
    !courseId ||
    Array.isArray(courseId)
  ) {
    return res.status(400).json({
      error: "ID du parcours, du niveau ou du cours manquant ou invalide",
    });
  }

  try {
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId, 10) },
    });

    if (!course) {
      return res.status(404).json({ error: "Cours non trouvé" });
    }

    if (course.levelId !== parseInt(levelId, 10)) {
      return res.status(400).json({
        error:
          "Le cours doit être associé au même niveau que cellui avec lequ'elle il a été créer pour être connecté à ce parcours",
      });
    }

    const updatedCourse = await prisma.course.update({
      where: { id: parseInt(courseId, 10) },
      data: {
        parcours: {
          connect: {
            id: parseInt(parcoursId, 10),
          },
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
      id: updatedCourse.id,
      name: updatedCourse.name,
      aliases: updatedCourse.aliases,
      semestre: updatedCourse.semestre,
      levelId: updatedCourse.levelId,
      parcoursIds: updatedCourse.parcours.map((p) => p.id),
      examTypeIds: updatedCourse.examTypes.map((e) => e.id),
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erreur lors de la connexion du cours au parcours et niveau",
    });
  }
};

export const disconnectCourseFromParcoursLevels = async (
  req: Request,
  res: Response,
) => {
  const { parcoursId, levelId, courseId } = req.params;

  if (
    !parcoursId ||
    Array.isArray(parcoursId) ||
    !levelId ||
    Array.isArray(levelId) ||
    !courseId ||
    Array.isArray(courseId)
  ) {
    return res.status(400).json({
      error: "ID du parcours, du niveau ou du cours manquant ou invalide",
    });
  }

  try {
    const updatedCourse = await prisma.course.update({
      where: { id: parseInt(courseId, 10) },
      data: {
        parcours: {
          disconnect: {
            id: parseInt(parcoursId, 10),
          },
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

    // Si le cours n'est plus associé à aucun parcours, on le supprime
    if (updatedCourse.parcours.length === 0) {
      await prisma.course.delete({
        where: { id: updatedCourse.id },
      });
      return res.status(200).json({ message: "Le cours a été supprimé" });
    }

    return res.status(200).json({
      id: updatedCourse.id,
      name: updatedCourse.name,
      semestre: updatedCourse.semestre,
      levelId: updatedCourse.levelId,
      parcoursIds: updatedCourse.parcours.map((p) => p.id),
      examTypeIds: updatedCourse.examTypes.map((e) => e.id),
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erreur lors de la déconnexion du cours du parcours et niveau",
    });
  }
};
