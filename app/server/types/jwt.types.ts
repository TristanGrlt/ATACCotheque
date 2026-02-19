import { JwtPayload } from 'jsonwebtoken';

/**
 * Token émis immédiatement après validation du couple username/password.
 * N'accorde AUCUN accès aux ressources protégées.
 * Valable 5 minutes, consommé lors de la vérification MFA.
 */
export interface PreAuthJwtPayload extends JwtPayload {
  type: 'pre-auth';
  userId: string;
  username: string;
}

/**
 * Token émis après validation complète : credentials + MFA (ou onboarding initial).
 * Seul token accepté par verifyToken sur les routes protégées.
 * `mfaVerified: true` est un invariant garanti à la construction.
 */
export interface SessionJwtPayload extends JwtPayload {
  type: 'session';
  userId: string;
  username: string;
  mfaVerified: true;
  onboardingComplete: boolean;
}

/**
 * Union discriminante sur le champ `type`.
 * Permet au compilateur de rejeter statiquement toute confusion entre les deux tokens.
 */
export type AppJwtPayload = PreAuthJwtPayload | SessionJwtPayload;

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
    jwtPayload?: SessionJwtPayload; 
  }
}