import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export const getRole = async (req: Request, res: Response) => {
  // Paramètres de pagination depuis query params
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const search = req.query.search as string || '';
  const sortBy = req.query.sortBy as string || 'name';
  const sortOrder = (req.query.sortOrder as string || 'asc') as 'asc' | 'desc';

  const skip = (page - 1) * pageSize;

  const whereClause = search ? {
    name: { contains: search, mode: 'insensitive' as const }
  } : {};

  try {
    const totalCount = await prisma.role.count({ where: whereClause });

    const roles = await prisma.role.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
    });

    return res.status(200).json({
      data: roles,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNextPage: page < Math.ceil(totalCount / pageSize),
        hasPreviousPage: page > 1,
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des rôles' });
  }
}

export const deleteRole = async (req: Request<{ roleId: string }>, res: Response) => {
  const { roleId } = req.params;

  try {
    const usersWithRole = await prisma.userRole.count({
      where: { roleId: parseInt(roleId) }
    });

    if (usersWithRole > 0) {
      return res.status(403).json({ 
        error: `Ce rôle est attribué à ${usersWithRole} utilisateur${usersWithRole > 1 ? 's' : ''}. Impossible de le supprimer.` 
      });
    }

    // Supprimer le rôle
    await prisma.role.delete({
      where: { id: parseInt(roleId) }
    });

    return res.status(200).json({ message: "Le rôle a bien été supprimé" });
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors de la suppression du rôle" });
  }
}