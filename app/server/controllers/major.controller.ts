import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

/**
 * Retrieves all majors from the database in ascending order by ID.
 * @param req - Express request object
 * @param res - Express response object
 * @returns JSON array of majors with status 200, or error message with status 500
 */
export const getMajor = async (req: Request, res: Response) => {
  try {
    const majors = await prisma.major.findMany({
      orderBy: { id: "asc" },
    });
    return res.status(200).json(majors);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erreur lors de la récupération des filières" });
  }
};

/**
 * Creates a new major with the provided name.
 * @param req - Express request object containing name in body
 * @param res - Express response object
 * @returns Created major object with status 201, or error message with status 400/409/500
 * @throws Returns 400 if name is empty or not provided
 * @throws Returns 409 if a major with the same name already exists (P2002 error)
 * @throws Returns 500 on unexpected database errors
 */
export const createMajor = async (req: Request, res: Response) => {
  const { name, icon } = req.body;

  const trimedName = name?.trim();
  const trimedIcon = icon?.trim();
  if (!trimedName) {
    return res
      .status(400)
      .json({ error: "Le nom de la filière est obligatoire" });
  }

  try {
    const major = await prisma.major.create({
      data: { name: trimedName, icon: trimedIcon },
    });
    return res.status(201).json(major);
  } catch (error: any) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Une filière avec ce nom existe déjà" });
    }
    return res
      .status(500)
      .json({ error: "Erreur lors de la création de la filière" });
  }
};

/**
 * Deletes a major by ID if it's not associated with any parcours.
 * @param req - Express request object containing majorId in params
 * @param res - Express response object
 * @returns Success message with status 200, or error message with status 400/403/500
 * @throws Returns 400 if majorId is missing or invalid
 * @throws Returns 403 if major is associated with one or more parcours
 * @throws Returns 500 on unexpected database errors
 */
export const deleteMajor = async (req: Request, res: Response) => {
  const { majorId } = req.params;

  if (!majorId || Array.isArray(majorId)) {
    return res.status(400).json({ error: "ID de la filière est requis" });
  }

  try {
    const parcoursWithMajor = await prisma.parcours.count({
      where: { majors: { some: { id: parseInt(majorId, 10) } } },
    });

    if (parcoursWithMajor > 0) {
      return res.status(403).json({
        error: `Cette filière est associée à ${parcoursWithMajor} parcours. Impossible de la supprimer.`,
      });
    }

    await prisma.major.delete({
      where: { id: parseInt(majorId, 10) },
    });

    return res.status(200).json({ message: "La filière a bien été supprimée" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erreur lors de la suppression de la filière" });
  }
};

/**
 * Updates an existing major's name by ID.
 * @param req - Express request object with majorId in params and name in body
 * @param res - Express response object
 * @returns Updated major object with status 200, or error message with status 400/409/500
 * @throws Returns 400 if majorId is missing, invalid, or not a valid number
 * @throws Returns 400 if name is empty or not provided
 * @throws Returns 409 if another major with the same name already exists (P2002 error)
 * @throws Returns 500 on unexpected database errors
 */
export const updateMajor = async (
  req: Request<{ majorId: string }>,
  res: Response,
) => {
  const { majorId } = req.params;
  const { name, icon } = req.body;

  if (!majorId || Array.isArray(majorId)) {
    return res.status(400).json({ error: "ID de la filière est requis" });
  }

  const majorIdNumber = parseInt(majorId, 10);
  if (isNaN(majorIdNumber)) {
    return res
      .status(400)
      .json({ error: "ID de la filière doit être un nombre valide" });
  }

  const trimedName = name?.trim();
  const trimedIcon = icon?.trim();
  if (!trimedName) {
    return res
      .status(400)
      .json({ error: "Le nom de la filière est obligatoire" });
  }

  try {
    const updatedMajor = await prisma.major.update({
      where: { id: majorIdNumber },
      data: { name: trimedName, icon: trimedIcon },
    });
    return res.status(200).json(updatedMajor);
  } catch (error: any) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Une filière avec ce nom existe déjà" });
    }
    return res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour de la filière" });
  }
};
