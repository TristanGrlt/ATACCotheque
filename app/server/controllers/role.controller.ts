import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { getPaginationParams, createPaginationResponse, getSkip } from '../utils/pagination.js';

/**
 * Récupère la liste des rôles avec pagination, recherche et tri
 * 
 * @param req - Objet Request Express avec query params optionnels :
 *   - page: Numéro de la page (défaut: 1)
 *   - pageSize: Nombre d'éléments par page (défaut: 20)
 *   - search: Terme de recherche pour filtrer par nom de rôle
 *   - sortBy: Champ de tri (défaut: 'name')
 *   - sortOrder: Ordre de tri 'asc' ou 'desc' (défaut: 'asc')
 * @param res - Objet Response Express
 * @returns Réponse JSON avec :
 *   - data: Tableau des rôles
 *   - pagination: Métadonnées de pagination
 * @throws {500} Erreur serveur lors de la récupération des rôles
 * 
 * @example
 * GET /api/roles?page=1&pageSize=10&search=admin&sortBy=name&sortOrder=asc
 */
export const getRole = async (req: Request, res: Response) => {
  const params = getPaginationParams(req, { sortBy: 'name' });
  const { search, sortBy, sortOrder, pageSize } = params;
  const skip = getSkip(params.page, params.pageSize);

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

    const response = createPaginationResponse(roles, totalCount, params);
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des rôles' });
  }
}

/**
 * Supprime un rôle spécifique après vérification qu'il n'est pas attribué à des utilisateurs
 * 
 * @param req - Objet Request Express avec param :
 *   - roleId: Identifiant du rôle à supprimer (string converti en number)
 * @param res - Objet Response Express
 * @returns Réponse JSON avec :
 *   - message: Confirmation de la suppression (200)
 *   - error: Message d'erreur si le rôle est utilisé (403) ou erreur serveur (500)
 * @throws {403} Si le rôle est attribué à un ou plusieurs utilisateurs
 * @throws {500} Erreur serveur lors de la suppression du rôle
 * 
 * @example
 * DELETE /api/roles/5
 */
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

export const getAccesRight = async (req: Request, res: Response) => {
  try {
    const acces = await prisma.accesRight.findMany();
    return res.status(200).json(acces);
  } catch(error) {
    return res.status(500).json({ error: "Erreur lors de la récupération des droits d'acès" });
  }
}