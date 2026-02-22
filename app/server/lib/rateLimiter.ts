import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import type { Request } from 'express';
import { JWT_SECRET } from '../app.js';
import type { PreAuthJwtPayload } from '../types/jwt.types.js';

/**
 * Helper pour extraire une clé IP compatible IPv6.
 * Utilise X-Forwarded-For si disponible (derrière un reverse-proxy),
 * sinon req.socket.remoteAddress.
 */
const safeIpKey = (req: Request): string =>
  req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()
  ?? req.socket?.remoteAddress
  ?? 'unknown';

/**
 * Rate limiter pour POST /user/login.
 * Clé : adresse IP.
 * 10 tentatives par fenêtre de 15 minutes.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
  },
});

/**
 * Rate limiter pour POST /user/mfa/verify.
 * Clé : userId extrait du cookie pre_auth_jwt.
 * Utiliser le userId plutôt que l'IP empêche le contournement par
 * changement d'adresse IP
 * 5 tentatives par fenêtre de 15 minutes.
 * Si le cookie est absent ou invalide, fallback sur l'IP.
 */
export const mfaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  // Clé personnalisée : userId depuis le pre-auth cookie
  keyGenerator: (req: Request): string => {
    try {
      const token = req.cookies?.pre_auth_jwt;
      if (!token) return safeIpKey(req);

      const decoded = jwt.verify(token, JWT_SECRET) as PreAuthJwtPayload;
      if (decoded?.type === 'pre-auth' && decoded.userId) {
        return `mfa:${decoded.userId}`;
      }
    } catch {
      // Token invalide ou expiré : fallback IP
    }
    return safeIpKey(req);
  },
  message: {
    error: 'Trop de tentatives MFA incorrectes. Réessayez dans 15 minutes.',
  },
});
