import { Request, Response, NextFunction } from 'express';
import { AppPermission } from '../generated/prisma/enums.js';
import prisma from '../lib/prisma.js';

export const verifyPerms = (perm: AppPermission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const currentUserId = req.userId;

    try {
      const roleWithPerm = await prisma.role.findFirst({
        where: {
          userRoles: { some: { userId: currentUserId } },
          permissions: { has: perm },
        },
      });

      if (!roleWithPerm) return res.status(403).json({ error: 'Accès non autorisé' });

      next();
    } catch (err) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  };
}