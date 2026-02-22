import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { JWT_SECRET } from '../app.js';
import { cookieOptions, preAuthCookieOptions } from '../utils/cookieOptions.js';
import { generateSessionToken } from '../utils/jwtHelper.js';
import { mfaRegistry } from '../lib/mfa/MfaRegistry.js';
import type { PreAuthJwtPayload } from '../types/jwt.types.js';

/**
 * Extrait et valide le pre-auth token depuis le cookie.
 * Retourne le payload ou null si absent / invalide / expiré.
 */
function extractPreAuthPayload(req: Request): PreAuthJwtPayload | null {
  const token = req.cookies?.pre_auth_jwt;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (
      typeof decoded !== 'object' ||
      !decoded ||
      (decoded as PreAuthJwtPayload).type !== 'pre-auth' ||
      !(decoded as PreAuthJwtPayload).userId
    ) {
      return null;
    }
    return decoded as PreAuthJwtPayload;
  } catch {
    return null;
  }
}

/**
 * Génère le challenge MFA côté serveur et le retourne au client.
 *
 * - TOTP : retourne {} (le secret est dans l'app de l'utilisateur)
 * - WebAuthn : génère un challenge aléatoire, le persiste en DB,
 *              retourne les options d'authentification pour @simplewebauthn/browser
 * GET /user/mfa/challenge/:method
 */
export const getMfaChallenge = async (req: Request, res: Response) => {
  const preAuth = extractPreAuthPayload(req);
  if (!preAuth) {
    return res.status(401).json({ error: 'Session MFA expirée. Reconnectez-vous.' });
  }

  const method = req.params.method as string;
  const strategy = mfaRegistry.get(method);
  if (!strategy) {
    return res.status(400).json({
      error: `Méthode MFA '${method}' non supportée.`,
      available: mfaRegistry.availableMethods(),
    });
  }

  try {
    const challenge = await strategy.generateChallenge(preAuth.userId);
    return res.status(200).json(challenge);
  } catch (error: any) {
    return res.status(400).json({ error: error?.message ?? 'Impossible de générer le challenge.' });
  }
};

/**
 * Vérifie la réponse MFA du client et, en cas de succès, échange le
 * pre-auth cookie contre un vrai cookie de session.
 *
 * POST /user/mfa/verify
 * Body : { code: string }            pour TOTP
 *      | AuthenticationResponseJSON  pour WebAuthn
 */
export const verifyMfaLogin = async (req: Request, res: Response) => {
  const preAuth = extractPreAuthPayload(req);
  if (!preAuth) {
    res.clearCookie('pre_auth_jwt', preAuthCookieOptions);
    return res.status(401).json({ error: 'Session MFA expirée. Reconnectez-vous.' });
  }

  const { userId } = preAuth;

  // Récupérer l'utilisateur et sa méthode MFA configurée
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      mfaEnabled: true,
      mfaMethod: true,
      passwordChangeRequired: true,
      mfaSetupRequired: true,
      userRoles: {
        select: {
          role: {
            select: { id: true, name: true, color: true, permissions: true },
          },
        },
      },
    },
  });

  if (!user?.mfaEnabled || !user.mfaMethod) {
    return res.status(400).json({ error: 'MFA non configuré pour cet utilisateur.' });
  }

  const strategy = mfaRegistry.get(user.mfaMethod);
  if (!strategy) {
    return res.status(400).json({ error: `Méthode MFA '${user.mfaMethod}' non supportée.` });
  }

  // Vérification du challenge
  let valid: boolean;
  try {
    valid = await strategy.verify({ userId, payload: req.body });
  } catch (error) {
    console.error('[MFA] Erreur inattendue lors de la vérification :', error);
    return res.status(500).json({ error: 'Erreur serveur lors de la vérification MFA.' });
  }

  if (!valid) {
    return res.status(401).json({ error: 'Code MFA invalide.' });
  }

  // Success
  res.clearCookie('pre_auth_jwt', preAuthCookieOptions);

  // Émettre le session token
  const sessionToken = generateSessionToken({
    id: user.id,
    username: user.username,
    passwordChangeRequired: user.passwordChangeRequired,
    mfaSetupRequired: user.mfaSetupRequired,
    mfaEnabled: user.mfaEnabled,
  });

  res.cookie('jwt', sessionToken, cookieOptions);

  return res.status(200).json({
    id: user.id,
    username: user.username,
    roles: user.userRoles.map((ur) => ur.role),
    requiresOnboarding: user.passwordChangeRequired,
  });
};

export const reinitMfa = async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'ID utilisateur requis.' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, mfaEnabled: true, mfaMethod: true },
  });

  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé.' });
  }

  if (!user.mfaEnabled || !user.mfaMethod) {
    return res.status(400).json({ error: 'MFA non configuré pour cet utilisateur.' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Supprimer les credentials WebAuthn
        await tx.webAuthnCredential.deleteMany({
          where: { userId }
        });
        // Supprimer les challenges WebAuthn en attente
        await tx.webAuthnChallenge.deleteMany({
          where: { userId }
        });
        // Mettre à jour l'utilisateur
        await tx.user.update({
          where: { id: userId },
          data: {
            mfaEnabled: false,
            mfaMethod: null,
            totpSecret: null,
            totpBackupCodes: [],
            mfaSetupRequired: true,
            mfaSetupDate: null,
          }
        });
    });
    return res.status(200).json({ message: 'MFA réinitialisé avec succès.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la réinitialisation MFA.' });
  }
}