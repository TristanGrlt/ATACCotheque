import { Request, Response } from 'express'
import prisma from '../lib/prisma.js';

export const getCourse = async (req: Request, res: Response) => {
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
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return res.json(result);
  } catch (error) {
    console.error("Erreur lors de la récupération des cours:", error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}
