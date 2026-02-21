import speakeasy from 'speakeasy';
import prisma from '../prisma.js';
import bcrypt from 'bcryptjs';
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
    // Accept either 6 digits (TOTP) or 6 alphanumeric characters (backup code)
    if (!code || !/^[A-Z0-9]{6}$/.test(code)) return false;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true, totpBackupCodes: true },
    });

    if (!user?.totpSecret) return false;

    // Try TOTP verification first if code is all digits
    if (/^\d{6}$/.test(code)) {
      if (speakeasy.totp.verify({
        secret: user.totpSecret,
        encoding: 'base32',
        token: code,
        window: 1, 
      })) {
        return true;
      }
    }

    // Vérification des codes de secours
    for (const backupCode of user.totpBackupCodes) {
      const isMatch = await bcrypt.compare(code, backupCode);
      if (isMatch) {
        // Supprimer le code de secours utilisé
        await prisma.user.update({
          where: { id: userId },
          data: {
            totpBackupCodes: {
              set: user.totpBackupCodes.filter(c => c !== backupCode)
            }
          }
        });
        return true;
      }
    }
    return false;
  }

  async isEnabledForUser(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true, mfaMethod: true },
    });
    return user?.mfaEnabled === true && user?.mfaMethod === 'totp';
  }
}
