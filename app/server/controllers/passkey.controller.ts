import { Request, Response } from 'express';
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
} from '@simplewebauthn/server';
import prisma from '../lib/prisma.js';
import { cookieOptions } from '../utils/cookieOptions.js';
import { generateSessionToken } from '../utils/jwtHelper.js';

const RP_ID = process.env.WEBAUTHN_RP_ID ?? 'localhost';
const ORIGIN = process.env.WEBAUTHN_ORIGIN ?? 'http://localhost:5173';
const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Génère un challenge WebAuthn discoverable (sans userId).
 * allowCredentials est vide : c'est l'authenticateur qui propose les passkeys
 * enregistrées pour ce rpID.
 *
 * GET /auth/passkey/challenge
 * Réponse : { challengeId, ...PublicKeyCredentialRequestOptionsJSON }
 */
export const getPasskeyChallenge = async (_req: Request, res: Response) => {
  try {
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: [], // discoverable credential — aucun userId requis
      userVerification: 'required',
    });

    const stored = await prisma.passkeyLoginChallenge.create({
      data: {
        challenge: options.challenge,
        expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
      },
    });

    return res.status(200).json({ challengeId: stored.id, ...options });
  } catch (error) {
    console.error('[Passkey] Erreur génération challenge :', error);
    return res.status(500).json({ error: 'Impossible de générer le challenge.' });
  }
};

/**
 * Vérifie la réponse WebAuthn et ouvre une session complète.
 * L'identité de l'utilisateur est déterminée via l'id du credential.
 *
 * POST /auth/passkey/verify
 * Body : { challengeId: string } + AuthenticationResponseJSON (à plat)
 */
export const verifyPasskeyLogin = async (req: Request, res: Response) => {
  const { challengeId, ...assertionBody } = req.body as AuthenticationResponseJSON & {
    challengeId: string;
  };

  if (!challengeId) {
    return res.status(400).json({ error: 'challengeId manquant.' });
  }

  // 1. Récupérer et valider le challenge stocké
  const stored = await prisma.passkeyLoginChallenge.findUnique({
    where: { id: challengeId },
  });

  if (!stored) {
    return res.status(400).json({ error: 'Challenge introuvable.' });
  }

  // supprimer le challenge
  await prisma.passkeyLoginChallenge.delete({ where: { id: challengeId } });

  if (stored.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Challenge expiré. Réessayez.' });
  }

  // 2. Retrouver le credential par son id (clé primaire)
  const credential = await prisma.webAuthnCredential.findUnique({
    where: { id: assertionBody.id },
    select: {
      id: true,
      publicKey: true,
      counter: true,
      transports: true,
      userId: true,
    },
  });

  if (!credential) {
    return res.status(401).json({ error: 'Credential inconnu.' });
  }

  // 3. Vérifier la réponse cryptographique
  let verified = false;
  let newCounter = 0;

  try {
    const result = await verifyAuthenticationResponse({
      response: assertionBody as AuthenticationResponseJSON,
      expectedChallenge: stored.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: credential.id,
        publicKey: credential.publicKey,
        counter: Number(credential.counter),
        transports: credential.transports as AuthenticatorTransportFuture[],
      },
      requireUserVerification: true,
    });
    verified = result.verified;
    newCounter = result.authenticationInfo?.newCounter ?? Number(credential.counter);
  } catch (error) {
    console.error('[Passkey] Erreur vérification :', error);
    return res.status(401).json({ error: 'Vérification WebAuthn échouée.' });
  }

  if (!verified) {
    return res.status(401).json({ error: 'Authentification WebAuthn refusée.' });
  }

  // 4. Mettre à jour le compteur et la date de dernière utilisation
  await prisma.webAuthnCredential.update({
    where: { id: credential.id },
    data: { counter: newCounter, lastUsedAt: new Date() },
  });

  // 5. Charger l'utilisateur et ses rôles
  const user = await prisma.user.findUnique({
    where: { id: credential.userId },
    select: {
      id: true,
      username: true,
      passwordChangeRequired: true,
      mfaSetupRequired: true,
      mfaEnabled: true,
      userRoles: {
        select: {
          role: {
            select: { id: true, name: true, color: true, permissions: true },
          },
        },
      },
    },
  });

  if (!user) {
    return res.status(401).json({ error: 'Utilisateur introuvable.' });
  }

  // 6. Émettre le session token
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
