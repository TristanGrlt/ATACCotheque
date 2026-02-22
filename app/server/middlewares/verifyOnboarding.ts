import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";

export const verifyOnboardingCompleted = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const jwtPayload = req.jwtPayload;

    // Si le payload JWT indique que l'onboarding est terminé, on autorise l'accès
    if (jwtPayload?.onboardingComplete === true) {
      return next();
    }

    // Sinon, on vérifie les étapes d'onboarding restantes pour l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { 
        passwordChangeRequired: true,
        mfaSetupRequired: true,
        mfaEnabled: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: "Utilisateur non trouvé" });
    }

    const needPasswordChange = user.passwordChangeRequired;
    const needMfaSetup = user.mfaSetupRequired && !user.mfaEnabled;

    if (needPasswordChange || needMfaSetup) {
      return res.status(403).json({ 
        error: "Onboarding incomplet",
        onboardingSteps: {
          passwordChangeRequired: needPasswordChange,
          mfaSetupRequired: needMfaSetup
        }
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors de la vérification de l'onboarding" });
  }
}