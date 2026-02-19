import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../app.js';
import { cookieOptions } from '../utils/cookieOptions.js';
import { AppJwtPayload, SessionJwtPayload } from '../types/jwt.types.js';

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.jwt;
  if (!token) {
    return res.status(401).json({ error: 'Accès non autorisé' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AppJwtPayload;

    if (typeof decoded !== 'object' || !decoded.userId) {
      return res.status(403).json({ error: 'Session invalide' });
    }

    
    if (decoded.type === 'pre-auth') {
      return res.status(403).json({ error: 'MFA non complété' });
    }

    const session = decoded as SessionJwtPayload;

    req.userId = session.userId;
    req.jwtPayload = session;

    // Renouveler le cookie pour prolonger la session
    res.cookie('jwt', token, cookieOptions);
    next();
  } catch {
    return res.status(403).json({ error: 'Session invalide' });
  }
};