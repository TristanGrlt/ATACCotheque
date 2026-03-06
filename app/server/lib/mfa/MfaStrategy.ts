/**
 * Données retournées au client pour initier un challenge.
 * TOTP : objet vide (le secret est déjà dans l'app).
 * WebAuthn : options d'authentification + liste des credentials autorisés.
 */
export type ChallengeData = Record<string, unknown>;

export interface MfaVerifyOptions {
  userId: string;
  /** Corps de la requête HTTP tel que reçu du client. */
  payload: unknown;
}

/**
 * Contrat que toute méthode MFA doit respecter.
 *
 * Pour ajouter une nouvelle méthode MFA :
 * 1. Créer une classe qui implémente cette interface
 * 2. L'enregistrer dans MfaRegistry
 */
export interface MfaStrategy {
  /** Identifiant de la méthode, correspondant à User.mfaMethod en base. */
  readonly name: string;

  /**
   * Génère un challenge côté serveur et le retourne au client.
   * - TOTP : no-op, retourne {}
   * - WebAuthn : génère un challenge aléatoire, le persiste, retourne les options
   */
  generateChallenge(userId: string): Promise<ChallengeData>;

  /**
   * Vérifie la réponse au challenge.
   * Ne throw jamais sauf erreur serveur inattendue.
   * @returns true si valide, false sinon.
   */
  verify(options: MfaVerifyOptions): Promise<boolean>;

  /**
   * Indique si l'utilisateur a cette méthode configurée et activée.
   * Utilisé au login pour choisir la bonne stratégie.
   */
  isEnabledForUser(userId: string): Promise<boolean>;
}
