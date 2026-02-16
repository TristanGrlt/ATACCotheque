import { JWT_SECRET } from "../app.js";
import jwt from "jsonwebtoken";
import { ExtendedJwtPayload } from "../types/jwt.types.js";
import prisma from "../lib/prisma.js";

interface UserForJwt {
  id: string;
  username: string;
  passwordChangeRequired: boolean;
  mfaSetupRequired: boolean;
  mfaEnabled: boolean;
}

export const generateAuthToken = (user: UserForJwt): string => {
  const payload: ExtendedJwtPayload = {
    userId: user.id,
    username: user.username,
    onboardingCompleted: !user.passwordChangeRequired && (!user.mfaSetupRequired || user.mfaEnabled)
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '900000' }); // 15 minutes
};

export const regenerateAuthTokenForUser = async (userId: string): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      passwordChangeRequired: true,
      mfaSetupRequired: true,
      mfaEnabled: true
    }
  });
  
  if (!user) {
    throw new Error("Utilisateur non trouvé");
  }

  return generateAuthToken(user);
}