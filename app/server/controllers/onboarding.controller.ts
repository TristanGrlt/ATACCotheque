import { Request, Response } from 'express';
import prisma from "../lib/prisma.js"
import bcrypt from 'bcryptjs';
import { regenerateAuthTokenForUser } from '../utils/jwtHelper.js';
import { cookieOptions } from '../utils/cookieOptions.js';

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

/*
* Permet à l'utilisateur de changer son mot de passe lors de la première connexion
* 
* @param req - Objet Request Express avec userId attaché par verifyToken et body contenant oldPassword et newPassword
* @param res - Objet Response Express
* @returns Réponse JSON avec :
*   - message: Confirmation du changement de mot de passe (200)
*   - error: Message d'erreur si les données sont invalides (400), ancien mot de passe incorrect (403), utilisateur non trouvé (404) ou erreur serveur (500)
* @throws {400} Si les données sont invalides (nouveau mot de passe trop court, absence de l'ancien mot de passe)
* @throws {403} Si l'ancien mot de passe est incorrect ou si le changement de mot de passe n'est pas requis
* @throws {404} Si l'utilisateur n'est pas trouvé
* @throws {500} Erreur serveur lors du changement de mot de passe
*/
export const changeFirstPassword = async (req: Request, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères" });
    }

    if(!oldPassword) {
      return res.status(400).json({ error: "L'ancien mot de passe est requis" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { 
        password: true,
        passwordChangeRequired: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    if (!user.passwordChangeRequired) {
      return res.status(400).json({ error: "Le changement de mot de passe n'est pas requis" });
    }
    
    // Vérifier que l'ancien mot de passe est correct
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(403).json({ error: "L'ancien mot de passe est incorrect" });
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    const isNewPasswordSameAsOld = await bcrypt.compare(newPassword, user.password);
    if (isNewPasswordSameAsOld) {
      return res.status(400).json({ error: "Le nouveau mot de passe doit être différent de l'ancien" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe et marquer le changement de mot de passe comme terminé
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        password: hashedPassword,
        passwordChangeRequired: false,
        isFirstLogin: false,
        lastPasswordChange: new Date()
      }
    });

    // Régénérer le token pour mettre à jour le payload avec onboardingCompleted si nécessaire
    const newToken = await regenerateAuthTokenForUser(req.userId as string);
    res.cookie('jwt', newToken, cookieOptions);

    return res.status(200).json({ message: "Mot de passe changé avec succès" });

  } catch (error) {
    return res.status(500).json({ error: "Erreur lors du changement de mot de passe" });
  }
}