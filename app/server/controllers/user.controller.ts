import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken'
import { JWT_SECRET } from '../app.js';
import { cookieOptions, preAuthCookieOptions } from '../utils/cookieOptions.js';
import { getPaginationParams, createPaginationResponse, getSkip } from '../utils/pagination.js';
import { generateSessionToken, generatePreAuthToken } from '../utils/jwtHelper.js';
import { Prisma } from '../generated/prisma/client.js';

/**
 * Interface pour les données utilisateur dans les requêtes
 */
interface IUser {
  username: string;
  password: string;
  roleIds:  Number[];
}

type SessionUserResponse = {
  id: string;
  username: string;
  roles: {
    id: number;
    name: string;
    color: string;
    permissions: string[];
  }[];
  requiredOnboarding: boolean;
};

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
      return {
        id: user.id,
        username: user.username,
        roles: user.userRoles.map(ur => ur.role),
        requiredOnboarding:
          user.passwordChangeRequired ||
          (user.mfaSetupRequired && !user.mfaEnabled)
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
  const currentUserId = req.userId;

  if (userId === currentUserId) {
    return res.status(401).json({ error: "Vous ne pouvez pas supprimer votre propre compte" })
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
    const { username, password, roleIds } = req.body;

    if (!roleIds || roleIds.length === 0) {
      return res.status(403).json({ error : "L'utilisateur doit poséder au moins un role"})
    }

    if(!username || !password) {
      return res.status(400).json({ error: "Le nom d'utilisateur et le mot de passe sont requis" });
    }

    const tusername = username.trim();
    if (tusername.length <= 3) {
      return res.status(400).json({ error: "Le nom d'utilisateur doit contenir au moins 4 caratères" });
    }

    const tpassword = password.trim();
    if (tpassword.length < 8) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(tpassword, saltRounds);

    const user = await prisma.user.create({
      data: {
        username: tusername,
        password: hashedPassword,
        passwordChangeRequired: true,
        mfaSetupRequired: true, 
        userRoles: {
          create: roleIds.map((id) => ({
            roleId: Number(id)
          })),
        },
      },
      include: {
        userRoles: { include: { role: true} }
      }
    });

    const sanitizedUser: SessionUserResponse = {
      id: user.id,
      username: user.username,
      roles: user.userRoles.map(ur => ur.role),
      requiredOnboarding:
        user.passwordChangeRequired ||
        (user.mfaSetupRequired && !user.mfaEnabled)
    };

    return res.status(201).json(sanitizedUser);
  } catch (error : any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
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
    where: { username },
    select: {
      id: true,
      username: true,
      password: true,
      passwordChangeRequired: true,
      mfaSetupRequired: true,
      mfaEnabled: true,
      mfaMethod: true,

      userRoles: {
        select: {
          role: {
            select: {
              id: true,
              name: true,
              color: true,
              permissions: true
            }
          }
        }
      }
    }
  });

  if (!user) {
    // Délai constant pour empêcher l'énumération d'utilisateurs par timing attack
    await bcrypt.compare(password, '$2b$10$invalidhashXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
    return res.status(401).json({ error: `Nom d'utilisateur ou mot de passe incorrect.` });
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.status(401).json({ error: `Nom d'utilisateur ou mot de passe incorrect.` });
  }

  // MFA activé : émettre un pre-auth toke
  if (user.mfaEnabled && user.mfaMethod) {
    const preAuthToken = generatePreAuthToken(user.id, user.username);
    res.cookie('pre_auth_jwt', preAuthToken, preAuthCookieOptions);

    return res.status(200).json({
      requiresMfa: true,
      mfaMethod: user.mfaMethod,
    });
  }

  // Pas de MFA 
  const token = generateSessionToken({
    id: user.id,
    username: user.username,
    passwordChangeRequired: user.passwordChangeRequired,
    mfaSetupRequired: user.mfaSetupRequired,
    mfaEnabled: user.mfaEnabled,
  });

  res.cookie('jwt', token, cookieOptions);

  const sanitizedUser: SessionUserResponse = {
    id: user.id,
    username: user.username,
    roles: user.userRoles.map(ur => ur.role),
    requiredOnboarding:
      user.passwordChangeRequired ||
      (user.mfaSetupRequired && !user.mfaEnabled)
  };

  return res.status(200).json(sanitizedUser);
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
  res.clearCookie('pre_auth_jwt', preAuthCookieOptions);
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
export const verifyUser = async (req: Request, res: Response) => {
  const token = req.cookies?.jwt;
  
  if (!token) {
    return res.status(401).json({ error: 'Accès non autorisé' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (typeof decoded !== 'object' || !decoded.userId) {
      return res.status(403).json({ error: 'Session invalide' });
    }

    // Récupérer l'utilisateur complet avec ses rôles et permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                color: true,
                permissions: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      res.clearCookie('jwt');
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    res.cookie('jwt', token, cookieOptions);
    
    const sanitizedUser: SessionUserResponse = {
      id: user.id,
      username: user.username,
      roles: user.userRoles.map(ur => ur.role),
      requiredOnboarding:
        user.passwordChangeRequired ||
        (user.mfaSetupRequired && !user.mfaEnabled)
    };
    res.status(200).json(sanitizedUser)
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
    const { username, password, roleIds } = req.body;
    const currentUserId = req.userId;

    // réupère l'utilisateur entrain d'être modifier
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: true } }
      }
    });

    // si l'utilisateur modifié existe pas erreur
    if (!existingUser) {
      return res.status(404).json({ error: "L'utilisateur n'existe pas" });
    }

    const updateData: any = {};
    let shouldDeleteMfaCredentials = false;
    // Si username modifier, l'appliqué
    if (username) {
      const tusername = username.trim();
      if (tusername.length <= 3) {
        return res.status(400).json({ error: "Le nom d'utilisateur doit contenir au moins 4 caratères" });
      }
      updateData.username = tusername;
      updateData.mfaSetupRequired = true;
      updateData.mfaEnabled = false;
      shouldDeleteMfaCredentials = true;
    }
    // Si mot de passe donné, le hashé et appliqué
    if (password) {
      const tpassword = password.trim();
      if (tpassword.length < 8) {
        return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères" });
      }
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(tpassword, saltRounds);
      updateData.passwordChangeRequired = true;
    }

    // si roles modifier, appliqué avec vérification
    if (roleIds) {
      // si plus aucun role, erreur
      if (roleIds.length === 0) {
        return res.status(400).json({ error: "Un utilisateur doit avoir au moins un rôle" });
      }

      // si l'utilisateur se modifie lui-même
      if (userId === currentUserId) {
        // détails des nouveaux rôles demandés
        const requestedRoles = await prisma.role.findMany({
          where: { id: { in: roleIds.map(id => Number(id)) } }
        });

        // vérifier si au moins un de ces rôles possède la permission MANAGE_USERS
        const hasAdminPermission = requestedRoles.some(role => 
          role.permissions.includes('MANAGE_USERS')
        );

        // Si il était admin et qu'il essaie de retirer son propre accès, erreur
        if (!hasAdminPermission) {
          return res.status(403).json({ 
            error: "Vous ne pouvez pas vous retirer la permission de gérer les utilisateurs." 
          });
        }
      }

      updateData.userRoles = {
        deleteMany: {},
        create: roleIds.map((id) => ({ roleId: Number(id) })),
      };
    }

    // Si le username change, supprimer les credentials MFA existants en transaction
    let user;
    if (shouldDeleteMfaCredentials) {
      user = await prisma.$transaction(async (tx) => {
        // Supprimer les credentials WebAuthn
        await tx.webAuthnCredential.deleteMany({
          where: { userId }
        });
        // Supprimer les challenges WebAuthn en attente
        await tx.webAuthnChallenge.deleteMany({
          where: { userId }
        });
        // Mettre à jour l'utilisateur
        return tx.user.update({
          where: { id: userId },
          data: updateData,
          include: {
            userRoles: { include: { role: true } }
          }
        });
      });
    } else {
      user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          userRoles: { include: { role: true } }
        }
      });
    }

    const sanitizedUser: SessionUserResponse = {
      id: user.id,
      username: user.username,
      roles: user.userRoles.map(ur => ur.role),
      requiredOnboarding:
        user.passwordChangeRequired ||
        (user.mfaSetupRequired && !user.mfaEnabled)
    };
    res.status(200).json(sanitizedUser)
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(400).json({
        error: `Le nom d'utilisateur "${req.body.username}" existe déjà`
      });
    }
    return res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
};