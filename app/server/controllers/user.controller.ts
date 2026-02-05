import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken'
import { JWT_SECRET } from '../app.js';
import { cookieOptions } from '../utils/cookieOptions.js';

interface IUser {
  username: string;
  password: string;
}

export const getUsers = async (req: Request<{}, {}, IUser>, res: Response) => {
  // Paramètres de pagination depuis query params
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const search = req.query.search as string || '';
  const sortBy = req.query.sortBy as string || 'username';
  const sortOrder = (req.query.sortOrder as string || 'asc') as 'asc' | 'desc';

  const skip = (page - 1) * pageSize;

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
    });

    const sanitizedUsers = usersList.map(user => {
      const { password: _pw, ...userData } = user;
      return userData;
    });

    // Retour avec format pagination
    return res.status(200).json({
      data: sanitizedUsers,
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
    return res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  }
}

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

export const logoutUser = (req: Request, res: Response) => {
  res.clearCookie('jwt');
  res.status(200).json({ message: "Déconnexion réussie" })
};

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