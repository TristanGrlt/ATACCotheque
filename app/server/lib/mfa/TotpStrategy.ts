import speakeasy from 'speakeasy';
import prisma from '../prisma.js';
import type { MfaStrategy, ChallengeData, MfaVerifyOptions } from './MfaStrategy.js';

export class TotpStrategy implements MfaStrategy {
  readonly name = 'totp';

  /** TOTP ne nécessite pas de challenge serveur. */
  async generateChallenge(_userId: string): Promise<ChallengeData> {
    return {};
  }

  async verify({ userId, payload }: MfaVerifyOptions): Promise<boolean> {
    const { code } = payload as { code?: string };

    // Validation de format rapide avant la requête DB
    if (!code || !/^\d{6}$/.test(code)) return false;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true },
    });

    if (!user?.totpSecret) return false;

    return speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: code,
      window: 1, 
    });
  }

  async isEnabledForUser(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true, mfaMethod: true },
    });
    return user?.mfaEnabled === true && user?.mfaMethod === 'totp';
  }
}
