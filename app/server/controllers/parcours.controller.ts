import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export const getParcours = async (req: Request, res: Response) => {
  try {
    const parcours = await prisma.parcours.findMany({
      orderBy: { id: 'asc' },
      include: {
        majors: {
          select: {
            id: true
          }
        }
      }
    });
    const formatted = parcours.map((p) => ({
      id: p.id,
      name: p.name,
      majorIds: p.majors.map((m) => m.id)
    }));
    return res.status(200).json(formatted);
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors de la récupération des parcours" });
  }
}

export const createParcours = async (req: Request, res: Response) => {
  const { name, majorIds = [] } = req.body;

  const trimedName = name?.trim();
   if (!trimedName) {
    return res.status(400).json({ error: "Le nom du parcours est obligatoire" });
  }

  try {
    const parcours = await prisma.parcours.create({
      data: { 
        name : trimedName,
        majors: {
          connect: majorIds.map((id: number) => ({ id }))
        }
      },
      include: {
        majors: {
          select: { id: true }
        }
      }
    });
    return res.status(201).json({
      id: parcours.id,
      name: parcours.name,
      majorIds: parcours.majors.map((m) => m.id)
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "Un parcours avec ce nom existe déjà" });
    }
    return res.status(500).json({ error: "Erreur lors de la création du parcours" });
  }
}

export const deleteParcours = async (req: Request, res: Response) => {
  const { parcoursId } = req.params;

  if (!parcoursId || Array.isArray(parcoursId) ) {
    return res.status(400).json({ error: "ID du parcours manquant ou invalide" });
  }

  try {
    const courseWithParcours = await prisma.course.count({
      where: { parcours: { some: { id: parseInt(parcoursId, 10)} } }
    });

    if (courseWithParcours > 0) {
      return res.status(403).json({ 
        error: `Ce parcours est associé à ${courseWithParcours} cours. Impossible de le supprimer.` 
      });
    }

    await prisma.parcours.delete({
      where: { id: parseInt(parcoursId, 10) }
    });

    return res.status(200).json({ message: "Le parcours a bien été supprimé" });
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors de la suppression du parcours" });
  }
}

export const updateParcours = async (req: Request, res: Response) => {
  const { parcoursId } = req.params;
  const { name, majorIds = [] } = req.body;

  if (!parcoursId || Array.isArray(parcoursId) ) {
    return res.status(400).json({ error: "ID du parcours manquant ou invalide" });
  }

  const trimedName = name?.trim();
   if (!trimedName) {
    return res.status(400).json({ error: "Le nom du parcours est obligatoire" });
  }

  try {
    const updatedParcours = await prisma.parcours.update({
      where: { id: parseInt(parcoursId, 10) },
      data: { 
        name: trimedName,
        majors: {
          set: majorIds.map((id: number) => ({ id }))
        }
      },
      include: {
        majors: {
          select: { id: true }
        }
      }
    });
    return res.status(200).json({
      id: updatedParcours.id,
      name: updatedParcours.name,
      majorIds: updatedParcours.majors.map((m) => m.id)
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "Un parcours avec ce nom existe déjà" });
    }
    return res.status(500).json({ error: "Erreur lors de la mise à jour du parcours" });
  }
}