import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from '../app.js';
import { cookieOptions } from '../utils/cookieOptions.js';

// Extend Request interface to add userId
declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.jwt;
  if (!token) {
    return res.status(401).json({ error: 'Accès non autorisé' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (typeof decoded !== 'object' || !decoded.userId) {
      return res.status(403).json({ error: 'Session invalide' });
    }
    req.userId = decoded.userId;
    res.cookie('jwt', token, cookieOptions);
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Session invalide' });
  }
};