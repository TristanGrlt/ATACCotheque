import { useState } from 'react'
import { startRegistration } from '@simplewebauthn/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircleIcon, CheckCircle2Icon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { apiRequest, getRequestMessage } from '@/services/api'

interface WebAuthnSetupProps {
  onSuccess: () => void
  onBack: () => void
}

type Step = 'name' | 'registering' | 'done'

/**
 * Guide l'utilisateur à travers l'enregistrement d'une clé de sécurité WebAuthn.
 *
 * Flux :
 *  1. Saisie d'un nom pour la clé (ex : "MacBook Touch ID")
 *  2. Appel POST /onboarding/webauthn/init → options de registration
 *  3. startRegistration() déclenche le dialogue natif du navigateur
 *  4. POST /onboarding/webauthn/verify avec la réponse signée
 *  5. Affichage du succès → appel de onSuccess()
 */
export function WebAuthnSetup({ onSuccess, onBack }: WebAuthnSetupProps) {
  const [step, setStep] = useState<Step>('name')
  const [credentialName, setCredentialName] = useState('Ma clé de sécurité')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. Obtenir les options d'enregistrement depuis le serveur
      const { data: options } = await apiRequest.post('/onboarding/webauthn/init')

      setStep('registering')

      // 2. Déclencher le dialogue natif WebAuthn (Touch ID, Windows Hello, YubiKey…)
      const registrationResponse = await startRegistration({ optionsJSON: options })

      // 3. Envoyer la réponse signée + le nom de la clé au serveur
      await apiRequest.post('/onboarding/webauthn/verify', {
        ...registrationResponse,
        credentialName,
      })

      setStep('done')
    } catch (err: any) {
      setStep('name')
      if (err?.name === 'NotAllowedError') {
        setError('Enregistrement annulé ou non autorisé.')
      } else if (err?.name === 'InvalidStateError') {
        setError('Cette clé est déjà enregistrée pour votre compte.')
      } else {
        setError(err.response?.data?.error ?? getRequestMessage(err) ?? 'Enregistrement échoué. Réessayez.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle2Icon className="mx-auto h-14 w-14 text-green-500" />
        <h3 className="text-lg font-semibold">Clé enregistrée avec succès !</h3>
        <p className="text-sm text-muted-foreground">
          <strong>{credentialName}</strong> est maintenant configurée pour protéger votre compte.
        </p>
        <Button className="w-full" onClick={onSuccess}>
          Continuer
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Donnez un nom à votre clé pour la retrouver facilement, puis suivez
        les instructions de votre navigateur (Touch ID, Windows Hello, YubiKey, etc.).
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="cred-name">Nom de la clé</Label>
        <Input
          id="cred-name"
          value={credentialName}
          onChange={e => setCredentialName(e.target.value)}
          placeholder="ex : MacBook Touch ID"
          disabled={loading}
        />
      </div>

      <Button
        className="w-full"
        onClick={handleRegister}
        disabled={loading || !credentialName.trim()}
      >
        {step === 'registering'
          ? '⏳ En attente du geste de sécurité…'
          : '🔑 Enregistrer ma clé de sécurité'}
      </Button>

      <button
        type="button"
        className="w-full text-center text-xs text-muted-foreground hover:underline"
        onClick={onBack}
        disabled={loading}
      >
        ← Choisir une autre méthode
      </button>
    </div>
  )
}
