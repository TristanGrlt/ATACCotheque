import { Request } from 'express';

/**
 * Interface représentant les paramètres de pagination extraits de la requête
 */
export interface PaginationParams {
  /** Numéro de la page courante (commence à 1) */
  page: number;
  /** Nombre d'éléments par page */
  pageSize: number;
  /** Terme de recherche pour filtrer les résultats */
  search: string;
  /** Champ sur lequel effectuer le tri */
  sortBy: string;
  /** Ordre de tri : ascendant ou descendant */
  sortOrder: 'asc' | 'desc';
}

/**
 * Interface générique pour le format de réponse paginée
 * @template T Type des données contenues dans le résultat
 */
export interface PaginationResult<T> {
  /** Tableau des données de la page courante */
  data: T[];
  /** Métadonnées de pagination */
  pagination: {
    /** Numéro de la page courante */
    page: number;
    /** Nombre d'éléments par page */
    pageSize: number;
    /** Nombre total d'éléments (tous résultats confondus) */
    totalCount: number;
    /** Nombre total de pages */
    totalPages: number;
    /** Indique s'il existe une page suivante */
    hasNextPage: boolean;
    /** Indique s'il existe une page précédente */
    hasPreviousPage: boolean;
  };
}

/**
 * Extrait et valide les paramètres de pagination depuis les query params de la requête
 * 
 * @param req - Objet Request Express contenant les query params
 * @param defaults - Valeurs par défaut optionnelles pour sortBy et pageSize
 * @param defaults.sortBy - Champ de tri par défaut (défaut: 'id')
 * @param defaults.pageSize - Taille de page par défaut (défaut: 20)
 * @returns Objet PaginationParams contenant tous les paramètres normalisés
 * 
 * @example
 * ```typescript
 * const params = getPaginationParams(req, { sortBy: 'username', pageSize: 10 });
 * // params = { page: 1, pageSize: 10, search: '', sortBy: 'username', sortOrder: 'asc' }
 * ```
 */
export const getPaginationParams = (
  req: Request,
  defaults: { sortBy?: string; pageSize?: number } = {}
): PaginationParams => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || defaults.pageSize || 20;
  const search = req.query.search as string || '';
  const sortBy = req.query.sortBy as string || defaults.sortBy || 'id';
  const sortOrder = (req.query.sortOrder as string || 'asc') as 'asc' | 'desc';

  return { page, pageSize, search, sortBy, sortOrder };
};

/**
 * Crée un objet de réponse paginée standardisé avec les données et métadonnées
 * 
 * @template T Type des éléments dans le tableau de données
 * @param data - Tableau des données à retourner pour la page courante
 * @param totalCount - Nombre total d'éléments (tous résultats confondus, avant pagination)
 * @param params - Paramètres de pagination utilisés pour la requête
 * @returns Objet PaginationResult contenant les données et métadonnées de pagination
 * 
 * @example
 * ```typescript
 * const users = await prisma.user.findMany({ skip, take: pageSize });
 * const totalCount = await prisma.user.count();
 * const response = createPaginationResponse(users, totalCount, params);
 * // response = { data: [...], pagination: { page: 1, pageSize: 20, ... } }
 * ```
 */
export const createPaginationResponse = <T>(
  data: T[],
  totalCount: number,
  params: PaginationParams
): PaginationResult<T> => {
  const { page, pageSize } = params;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    }
  };
};

/**
 * Calcule le nombre d'éléments à sauter (skip) pour la pagination Prisma
 * 
 * @param page - Numéro de la page courante (commence à 1)
 * @param pageSize - Nombre d'éléments par page
 * @returns Nombre d'éléments à sauter pour atteindre la page demandée
 * 
 * @example
 * ```typescript
 * const skip = getSkip(3, 20); // Retourne 40 (pour obtenir la page 3)
 * const users = await prisma.user.findMany({ skip, take: 20 });
 * ```
 */
export const getSkip = (page: number, pageSize: number): number => {
  return (page - 1) * pageSize;
};
