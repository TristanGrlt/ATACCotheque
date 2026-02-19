import { Request, Response } from 'express';
import prisma from "../lib/prisma.js"
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  type AuthenticatorTransportFuture,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { regenerateSessionTokenForUser } from '../utils/jwtHelper.js';
import { cookieOptions } from '../utils/cookieOptions.js';

const RP_ID = process.env.WEBAUTHN_RP_ID ?? 'localhost';
const ORIGIN = process.env.WEBAUTHN_ORIGIN ?? 'http://localhost:5173';
const RP_NAME = 'ATACCothèque';
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

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
    const newToken = await regenerateSessionTokenForUser(req.userId as string);
    res.cookie('jwt', newToken, cookieOptions);

    return res.status(200).json({ message: "Mot de passe changé avec succès" });

  } catch (error) {
    return res.status(500).json({ error: "Erreur lors du changement de mot de passe" });
  }
}


/*
* Permet à l'utilisateur d'initialiser la configuration MFA TOTP
* @param req - Objet Request Express avec userId attaché par verifyToken
* @param res - Objet Response Express
* @returns Réponse JSON avec :
*  - secret: Le secret
*  - qrCode: Le QR code encodé en base32 pour configurer l'application d'authentification
*  - message: Instructions pour l'utilisateur
* @throws {400} Si la configuration MFA n'est pas requise pour l'utilisateur
* @throws {404} Si l'utilisateur n'est pas trouvé
* @throws {500} Erreur serveur lors de l'initialisation de la configuration MFA
*/
export const initTOTPSetup = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        username: true,
        mfaSetupRequired: true,
        totpSecret: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Vérifier que la configuration MFA est requise pour cet utilisateur
    if (!user.mfaSetupRequired) {
      return res.status(400).json({ error: "La configuration MFA n'est pas requise pour cet utilisateur" });
    }

    // Générer un secret TOTP pour l'utilisateur
    const secret = speakeasy.generateSecret({
      name: `ATACCothèque (${user.username})`
    });

    // Générer un QR code à partir de l'URL otpauth
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // Enregistrer le secret TOTP dans la base de données pour l'utilisateur mais n'active pas encore MFA tant que l'utilisateur n'a pas confirmé la configuration
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        totpSecret: secret.base32
      }
    });

    return res.status(200).json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      message: `Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, etc.) pour configurer votre MFA.`
    });
 } catch (error) {
    return res.status(500).json({ error: "Erreur lors de l'initialisation de la configuration MFA" });
 }
}

/*
* Permet à l'utilisateur de vérifier le code TOTP et d'activer MFA pour son compte
* @param req - Objet Request Express avec userId attaché par verifyToken et body contenant le code TOTP à vérifier
* @param res - Objet Response Express
* @returns Réponse JSON avec :
*  - message: Confirmation de l'activation de MFA (200)
*  - backupCodes: Les codes de secours générés pour l'utilisateur (uniquement retournés lors de l'activation réussie)
*  - error: Message d'erreur
* @throws {400} Si les données sont invalides (code TOTP manquant ou de longueur incorrecte) ou si la configuration MFA n'est pas initialisée pour l'utilisateur
* @throws {403} Si le code TOTP est incorrect
* @throws {404} Si l'utilisateur n'est pas trouvé
* @throws {500} Erreur serveur lors de la vérification du code TOTP ou de l'activation de MFA
*/
export const verifyAndEnableTOTP = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code || code.length !== 6) {
      return res.status(400).json({ error: "Le code est invalide" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        totpSecret: true,
        mfaSetupRequired: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Vérifier que la configuration MFA est requise pour cet utilisateur et que le secret TOTP est bien initialisé
    if (!user.mfaSetupRequired || !user.totpSecret) {
      return res.status(400).json({ error: "La configuration MFA n'est pas initialisée pour cet utilisateur" });
    }

    // Vérifier que le code TOTP fourni est correct
    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!verified) {
      return res.status(403).json({ error: "Le code MFA est incorrect" });
    }

    // Générer des codes de secours pour le cas où l'utilisateur perdrait l'accès à son application d'authentification
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );

    // Activer MFA pour l'utilisateur et enregistrer les codes de secours (hashés) dans la base de données
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        mfaEnabled: true,
        mfaMethod: 'totp',
        mfaSetupRequired: false,
        mfaSetupDate: new Date(),
        totpBackupCodes: backupCodes.map(code => bcrypt.hashSync(code, 10))
      }
    });

    // Régénérer le token pour mettre à jour le payload avec onboardingCompleted si nécessaire
    const newToken = await regenerateSessionTokenForUser(req.userId as string);
    res.cookie('jwt', newToken, cookieOptions);

    return res.status(200).json({ 
      message: "MFA TOTP activé avec succès",
      backupCodes // Les codes de secours sont retournés en clair une seule fois.
    });

  } catch (error) {
    return res.status(500).json({ error: "Erreur lors de la vérification du code MFA" });
  }
}

/*
 * Génère les options d'enregistrement WebAuthn et persiste le challenge
 * éphémère en base. Le client doit passer ces options à startRegistration(),
 * puis soumettre la réponse à POST /onboarding/webauthn/verify.
 */
export const initWebAuthnSetup = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        mfaSetupRequired: true,
        webauthnCredentials: { select: { id: true, transports: true } },
      },
    });

    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    if (!user.mfaSetupRequired)
      return res.status(400).json({ error: "La configuration MFA n'est pas requise" });

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: user.username,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      // Exclure les clés déjà enregistrées (évite les doublons)
      excludeCredentials: user.webauthnCredentials.map(cred => ({
        id: cred.id,
        transports: cred.transports as AuthenticatorTransportFuture[],
      })),
    });

    // Persister le challenge — un seul actif par utilisateur
    await prisma.webAuthnChallenge.upsert({
      where: { userId },
      create: { userId, challenge: options.challenge, expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS) },
      update: { challenge: options.challenge, expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS) },
    });

    return res.status(200).json(options);
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors de l'initialisation WebAuthn" });
  }
};

/*
 * Vérifie la réponse d'enregistrement WebAuthn, crée le credential en base
 * et active MFA pour l'utilisateur.
 *
 * Body attendu : RegistrationResponseJSON + optionnel credentialName: string
 */
export const verifyAndEnableWebAuthn = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSetupRequired: true, webauthnChallenge: true },
    });

    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    if (!user.mfaSetupRequired)
      return res.status(400).json({ error: "La configuration MFA n'est pas requise" });

    const stored = user.webauthnChallenge;
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(400).json({ error: "Challenge expiré. Recommencez l'enregistrement." });
    }

    const { credentialName, ...registrationBody } = req.body as RegistrationResponseJSON & { credentialName?: string };

    const { verified, registrationInfo } = await verifyRegistrationResponse({
      response: registrationBody as RegistrationResponseJSON,
      expectedChallenge: stored.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: false,
    });

    if (!verified || !registrationInfo) {
      return res.status(403).json({ error: "L'enregistrement WebAuthn a échoué" });
    }

    const { credential, credentialDeviceType, credentialBackedUp } = registrationInfo;

    // Transaction atomique : créer le credential + activer MFA + supprimer le challenge
    await prisma.$transaction([
      prisma.webAuthnCredential.create({
        data: {
          id: credential.id,
          userId,
          publicKey: Buffer.from(credential.publicKey),
          counter: BigInt(credential.counter),
          deviceType: credentialDeviceType,
          backedUp: credentialBackedUp,
          transports: credential.transports ?? [],
          name: credentialName ?? 'Clé de sécurité',
        },
      }),
      prisma.webAuthnChallenge.delete({ where: { userId } }),
      prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: true,
          mfaMethod: 'webauthn',
          mfaSetupRequired: false,
          mfaSetupDate: new Date(),
        },
      }),
    ]);

    const newToken = await regenerateSessionTokenForUser(userId);
    res.cookie('jwt', newToken, cookieOptions);

    return res.status(200).json({ message: 'Clé de sécurité enregistrée avec succès' });
  } catch (error) {
    console.error('[WebAuthn register] error:', error);
    return res.status(500).json({ error: 'Erreur lors de la vérification WebAuthn' });
  }
};