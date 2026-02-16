import { Request, Response } from 'express';
import prisma from "../lib/prisma.js"

/*
 * Récupère les informations d'onboarding de l'utilisateur connecté
 * 
 * @param req - Objet Request Express avec userId attaché par verifyToken
 * @param res - Objet Response Express
 * @returns Réponse JSON avec :
 *   - isFirstLogin: Indique si c'est la première connexion de l'utilisateur
 *   - onboardingComplete: Indique si l'onboarding est complet
 *   - steps: Détail des étapes d'onboarding (changement de mot de passe, configuration MFA)
 * @throws {404} Si l'utilisateur n'est pas trouvé
 * @throws {500} Erreur serveur lors de la récupération des informations d'onboarding
 * 
*/
export const getOnboardingStatus = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        isFirstLogin: true,
        passwordChangeRequired: true,
        mfaSetupRequired: true,
        mfaEnabled: true,
        mfaMethod: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const onboardingComplete = !user.passwordChangeRequired && (!user.mfaSetupRequired || user.mfaEnabled);

    return res.status(200).json({
      isFirstLogin: user.isFirstLogin,
      onboardingComplete,
      Steps: {
        passwordChange: {
          required: user.passwordChangeRequired,
          completed: !user.passwordChangeRequired
        },
        mfaSetup: {
          required: user.mfaSetupRequired,
          completed: user.mfaEnabled,
          method: user.mfaMethod
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Erreur d'onboarding" });
  }        
};