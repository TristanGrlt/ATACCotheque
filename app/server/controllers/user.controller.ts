import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken'
import { JWT_SECRET } from '../app.js';
import { cookieOptions } from '../utils/cookieOptions.js';
import { getPaginationParams, createPaginationResponse, getSkip } from '../utils/pagination.js';

/**
 * Interface pour les données utilisateur dans les requêtes
 */
interface IUser {
  username: string;
  password: string;
}

/**
 * Récupère la liste des utilisateurs avec pagination, recherche et tri
 * Les mots de passe sont exclus des données retournées pour des raisons de sécurité
 * 
 * @param req - Objet Request Express avec query params optionnels :
 *   - page: Numéro de la page (défaut: 1)
 *   - pageSize: Nombre d'éléments par page (défaut: 20)
 *   - search: Terme de recherche pour filtrer par nom d'utilisateur
 *   - sortBy: Champ de tri (défaut: 'username')
 *   - sortOrder: Ordre de tri 'asc' ou 'desc' (défaut: 'asc')
 * @param res - Objet Response Express
 * @returns Réponse JSON avec :
 *   - data: Tableau des utilisateurs (sans mot de passe)
 *   - pagination: Métadonnées de pagination
 * @throws {500} Erreur serveur lors de la récupération des utilisateurs
 * 
 * @example
 * GET /api/users?page=1&pageSize=10&search=john&sortBy=username&sortOrder=asc
 */
export const getUsers = async (req: Request<{}, {}, IUser>, res: Response) => {
  const params = getPaginationParams(req, { sortBy: 'username' });
  const { search, sortBy, sortOrder, pageSize } = params;
  const skip = getSkip(params.page, params.pageSize);

  // Construction de la condition de recherche
  const whereClause = search ? {
    username: { contains: search, mode: 'insensitive' as const }
  } : {};

  try {
    // Compte total pour la pagination
    const totalCount = await prisma.user.count({ where: whereClause });

    // Récupération paginée avec tri
    const usersList = await prisma.user.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    const sanitizedUsers = usersList.map(user => {
      const { password: _pw, userRoles, ...userData } = user;
      return {
        ...userData,
        roles: userRoles.map(ur => ur.role.name)
      };
    });

    // Retour avec format pagination
    const response = createPaginationResponse(sanitizedUsers, totalCount, params);
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  }
}

/**
 * Supprime un utilisateur spécifique après vérification qu'il reste au moins un utilisateur
 * 
 * @param req - Objet Request Express avec param :
 *   - userId: Identifiant de l'utilisateur à supprimer (string)
 * @param res - Objet Response Express
 * @returns Réponse JSON avec :
 *   - message: Confirmation de la suppression (200)
 *   - error: Message d'erreur si c'est le dernier utilisateur (403) ou erreur serveur (500)
 * @throws {403} Si la suppression rendrait le nombre d'utilisateurs nul
 * @throws {500} Erreur serveur lors de la suppression de l'utilisateur
 * 
 * @example
 * DELETE /api/users/abc123
 */
export const deleteUser= async (req: Request<{ userId: string }, {}, IUser>, res: Response) => {
  const { userId } = req.params;

  const nUsers = await prisma.user.count();
  if (nUsers <= 1) {
    return res.status(403).json({ error: "Le nombre d'utilisateurs doit ne peut pas être nul" });
  }
  
  try {
    await prisma.user.delete({
      where: { id: userId }
    });
    return res.status(200).json({ message: "L'utilisateur à bien été supprimé" });
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors de la suppression de l'utilisateur" });
  }
}

/**
 * Crée un nouveau compte utilisateur avec mot de passe hashé
 * 
 * @param req - Objet Request Express avec body :
 *   - username: Nom d'utilisateur (doit être unique)
 *   - password: Mot de passe en clair (sera hashé avec bcrypt)
 * @param res - Objet Response Express
 * @returns Réponse JSON avec :
 *   - Données de l'utilisateur créé sans mot de passe (201)
 *   - error: Message d'erreur si le nom existe déjà (400) ou erreur serveur (500)
 * @throws {400} Si le nom d'utilisateur existe déjà (erreur Prisma P2002)
 * @throws {500} Erreur serveur lors de la création de l'utilisateur
 * 
 * @example
 * POST /api/users/signup
 * Body: { "username": "john.doe", "password": "secretPass123" }
 */
export const signupUser = async (req: Request<{}, {}, IUser>, res: Response) => {
  try {
    const { username, password } = req.body;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      }
    });

    const { password: _pw, ...userData } = user;
    return res.status(201).json(userData);
  } catch (error : any) {
    if (error?.code === 'P2002') {
      return res.status(400).json({
        error: `Le nom d'utilisateur "${req.body.username}" existe déjà`
      });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Authentifie un utilisateur et crée une session via JWT cookie
 * 
 * @param req - Objet Request Express avec body :
 *   - username: Nom d'utilisateur
 *   - password: Mot de passe en clair
 * @param res - Objet Response Express
 * @returns Réponse JSON avec :
 *   - Données de l'utilisateur sans mot de passe (200) + cookie JWT
 *   - error: Message d'erreur si identifiants incorrects (401)
 * @throws {401} Si le nom d'utilisateur n'existe pas ou si le mot de passe est incorrect
 * 
 * @example
 * POST /api/users/login
 * Body: { "username": "john.doe", "password": "secretPass123" }
 */
export const loginUser = async (req: Request<{}, {}, IUser>, res: Response) => {
  const { username, password } = req.body;

  const user = await prisma.user.findUnique({ 
    where: { username } 
  });
  
  if (!user) {
    return res.status(401).json({ error: `Nom d'utilisateur ou mot de passe incorrect.` });
  }

  const match = await bcrypt.compare(password, user.password);
  if (match) {
    const jsToken = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET);
    res.cookie('jwt', jsToken, cookieOptions);

    const { password: _pw, ...userData } = user;
    return res.status(200).json(userData)
  } else {
    return res.status(401).json({ error: `Nom d'utilisateur ou mot de passe incorrect` });
  }
};

/**
 * Déconnecte l'utilisateur en supprimant le cookie JWT
 * 
 * @param req - Objet Request Express
 * @param res - Objet Response Express
 * @returns Réponse JSON avec message de confirmation (200)
 * 
 * @example
 * POST /api/users/logout
 */
export const logoutUser = (req: Request, res: Response) => {
  res.clearCookie('jwt');
  res.status(200).json({ message: "Déconnexion réussie" })
};

/**
 * Vérifie la validité de la session utilisateur via le JWT cookie
 * Renouvelle automatiquement le cookie si la session est valide
 * 
 * @param req - Objet Request Express avec cookie JWT
 * @param res - Objet Response Express
 * @returns Réponse JSON avec :
 *   - username: Nom d'utilisateur si session valide (200) + cookie renouvelé
 *   - error: Message d'erreur si non autorisé (401) ou session invalide (403)
 * @throws {401} Si aucun token n'est fourni
 * @throws {403} Si le token est invalide ou malformé
 * 
 * @example
 * GET /api/users/verify
 */
export const verifyUser = (req: Request, res: Response) => {
  const token = req.cookies?.jwt;
  
  if (!token) {
    return res.status(401).json({ error: 'Accès non autorisé' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (typeof decoded !== 'object' || !decoded.userId) {
      return res.status(403).json({ error: 'Session invalide' });
    }
    res.cookie('jwt', token, cookieOptions);
    res.status(200).json({ username: decoded.username })
  } catch (error) {
    res.clearCookie('jwt');
    res.status(401).json({ error: 'Session invalide' });
  }
}

/**
 * Met à jour un utilisateur existant
 * 
 * @param req - Objet Request Express avec param :
 *   - userId: Identifiant de l'utilisateur à modifier (string)
 *   - body: { username?: string, password?: string }
 * @param res - Objet Response Express
 * @returns Réponse JSON avec :
 *   - Données de l'utilisateur mis à jour sans mot de passe (200)
 *   - error: Message d'erreur si le nom existe déjà (400) ou erreur serveur (500)
 * @throws {400} Si le nom d'utilisateur existe déjà
 * @throws {500} Erreur serveur lors de la mise à jour de l'utilisateur
 * 
 * @example
 * PUT /api/users/abc123
 * Body: { "username": "john.doe", "password": "newPass123" }
 */
export const updateUser = async (req: Request<{ userId: string }, {}, Partial<IUser>>, res: Response) => {
  try {
    const { userId } = req.params;
    const { username, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: "L'utilisateur n'existe pas" });
    }

    const updateData: any = {};
    
    if (username !== undefined) {
      updateData.username = username;
    }
    
    if (password !== undefined) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const { password: _pw, ...userData } = user;
    return res.status(200).json(userData);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(400).json({
        error: `Le nom d'utilisateur "${req.body.username}" existe déjà`
      });
    }
    return res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
};