import { JWT_SECRET } from '../app.js';
import jwt from 'jsonwebtoken';
import { PreAuthJwtPayload, SessionJwtPayload } from '../types/jwt.types.js';
import prisma from '../lib/prisma.js';


export const PRE_AUTH_TTL_SECONDS = 5 * 60; // 5 mins

const SESSION_TTL = '7d'; // 7 jours

interface UserForSessionToken {
  id: string;
  username: string;
  passwordChangeRequired: boolean;
  mfaSetupRequired: boolean;
  mfaEnabled: boolean;
}

/**
 * Génère un pre-auth token (étape 1 du login). N'accorde aucun accès aux 
 * ressources protégées. Valable PRE_AUTH_TTL_SECONDS secondes.
 */
export const generatePreAuthToken = (userId: string, username: string): string => {
  const payload: PreAuthJwtPayload = {
    type: 'pre-auth',
    userId,
    username,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: PRE_AUTH_TTL_SECONDS });
};

/**
 * Génère un session token complet (étape 2 du login, après MFA validé).
 * mfaVerified est un invariant garanti à la construction par le type.
 */
export const generateSessionToken = (user: UserForSessionToken): string => {
  const payload: SessionJwtPayload = {
    type: 'session',
    userId: user.id,
    username: user.username,
    mfaVerified: true,
    onboardingComplete:
      !user.passwordChangeRequired &&
      (!user.mfaSetupRequired || user.mfaEnabled),
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_TTL });
};

/**
 * Recharge les flags d'onboarding depuis la DB et régénère un session token.
 */
export const regenerateSessionTokenForUser = async (userId: string): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      passwordChangeRequired: true,
      mfaSetupRequired: true,
      mfaEnabled: true,
    },
  });

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  return generateSessionToken(user);
};