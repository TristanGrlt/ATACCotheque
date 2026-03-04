import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
} from '@simplewebauthn/server';
import prisma from '../prisma.js';
import type { MfaStrategy, ChallengeData, MfaVerifyOptions } from './MfaStrategy.js';

// Ces valeurs doivent correspondre exactement à l'origine du frontend.
const RP_ID = process.env.WEBAUTHN_RP_ID ?? 'localhost';
const ORIGIN = process.env.WEBAUTHN_ORIGIN ?? 'http://localhost:5173';

/** TTL d'un challenge WebAuthn en millisecondes (5 minutes). */
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export class WebAuthnStrategy implements MfaStrategy {
  readonly name = 'webauthn';

  /**
   * Génère les options d'authentification WebAuthn et persiste le challenge
   * en base (table WebAuthnChallenge). Un seul challenge actif par utilisateur.
   */
  async generateChallenge(userId: string): Promise<ChallengeData> {
    const credentials = await prisma.webAuthnCredential.findMany({
      where: { userId },
      select: { id: true, transports: true },
    });

    if (credentials.length === 0) {
      throw new Error('Aucun credential WebAuthn enregistré pour cet utilisateur.');
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: credentials.map((c) => ({
        id: c.id,
        transports: c.transports as AuthenticatorTransportFuture[],
      })),
      userVerification: 'required',
    });

    // Upsert : écrase le challenge précédent si l'utilisateur avait déjà un challenge actif
    await prisma.webAuthnChallenge.upsert({
      where: { userId },
      create: {
        userId,
        challenge: options.challenge,
        expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
      },
      update: {
        challenge: options.challenge,
        expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
      },
    });

    return options as unknown as ChallengeData;
  }

  async verify({ userId, payload }: MfaVerifyOptions): Promise<boolean> {
    const response = payload as AuthenticationResponseJSON;

    // Récupérer le challenge stocké
    const stored = await prisma.webAuthnChallenge.findUnique({
      where: { userId },
    });

    if (!stored) return false;

    // Vérifier le TTL
    if (stored.expiresAt < new Date()) {
      await prisma.webAuthnChallenge.delete({ where: { userId } });
      return false;
    }

    // Récupérer le credential correspondant à la réponse
    const credential = await prisma.webAuthnCredential.findUnique({
      where: { id: response.id },
      select: { id: true, publicKey: true, counter: true, transports: true, userId: true },
    });

    // Le credential doit appartenir à cet utilisateur
    if (!credential || credential.userId !== userId) return false;

    try {
      const { verified, authenticationInfo } = await verifyAuthenticationResponse({
        response,
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

      if (!verified) return false;

      // Mettre à jour le compteur et la date de dernière utilisation
      await Promise.all([
        prisma.webAuthnCredential.update({
          where: { id: credential.id },
          data: {
            counter: authenticationInfo.newCounter,
            lastUsedAt: new Date(),
          },
        }),
        // Supprimer le challenge
        prisma.webAuthnChallenge.delete({ where: { userId } }),
      ]);

      return true;
    } catch {
      return false;
    }
  }

  async isEnabledForUser(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true, mfaMethod: true },
    });
    return user?.mfaEnabled === true && user?.mfaMethod === 'webauthn';
  }
}
