import type { MfaStrategy } from './MfaStrategy.js';
import { TotpStrategy } from './TotpStrategy.js';
import { WebAuthnStrategy } from './WebAuthnStrategy.js';

/**
 * Registre central des stratégies MFA disponibles.
 *
 * Pour activer / désactiver une méthode : modifier uniquement ce fichier.
 * Aucune autre partie du code n'a besoin d'être touchée.
 */
class MfaRegistry {
  private readonly strategies = new Map<string, MfaStrategy>();

  register(strategy: MfaStrategy): this {
    this.strategies.set(strategy.name, strategy);
    return this;
  }

  /** Retourne la stratégie ou undefined si la méthode n'est pas supportée. */
  get(name: string): MfaStrategy | undefined {
    return this.strategies.get(name);
  }

  /** Noms des méthodes disponibles — utile pour exposer les options à l'UI. */
  availableMethods(): string[] {
    return [...this.strategies.keys()];
  }
}

export const mfaRegistry = new MfaRegistry()
  .register(new TotpStrategy())
  .register(new WebAuthnStrategy());
