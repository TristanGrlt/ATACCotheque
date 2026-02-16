import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from '../app.js';
import { cookieOptions } from '../utils/cookieOptions.js';
import { ExtendedJwtPayload } from '../types/jwt.types.js';


export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.jwt;
  if (!token) {
    return res.status(401).json({ error: 'Accès non autorisé' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as ExtendedJwtPayload;
    // Vérifier que le payload contient les informations nécessaires
    if (typeof decoded !== 'object' || !decoded.userId) {
      return res.status(403).json({ error: 'Session invalide' });
    }

    // Attacher les informations de l'utilisateur à la requête
    req.userId = decoded.userId;
    req.jwtPayload = decoded;

    // Renouveler le token pour prolonger la session
    res.cookie('jwt', token, cookieOptions);
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Session invalide' });
  }
};