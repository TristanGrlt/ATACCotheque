import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { startAuthentication } from '@simplewebauthn/browser'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircleIcon } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { apiRequest } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

interface WebAuthnChallengeProps {
  redirectTo: string
}

export function WebAuthnChallenge({ redirectTo }: WebAuthnChallengeProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { refreshAuth } = useAuth()
  const navigate = useNavigate()

  const handleAuthenticate = async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. Récupérer les options d'authentification depuis le serveur
      const { data: options } = await apiRequest.get('/user/mfa/challenge/webauthn')

      // 2. Déclencher le dialogue natif WebAuthn (Touch ID, Windows Hello, YubiKey…)
      //    startAuthentication gère automatiquement le protocole CBOR/CTAP
      const assertion = await startAuthentication({ optionsJSON: options })

      // 3. Envoyer la réponse signée au serveur pour vérification
      await apiRequest.post('/user/mfa/verify', assertion)

      // 4. Le session cookie est positionné — hydrater le contexte
      const { requiresOnboarding } = await refreshAuth()
      navigate(requiresOnboarding ? '/onboarding' : redirectTo, { replace: true })
    } catch (err: any) {
      // Distinguer l'annulation utilisateur des vraies erreurs
      if (err?.name === 'NotAllowedError') {
        setError('Authentification annulée.')
      } else {
        setError(err.response?.data?.error ?? 'Authentification échouée. Réessayez.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground text-center">
        Utilisez votre clé de sécurité ou authentificateur enregistré pour vous connecter.
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button className="w-full" onClick={handleAuthenticate} disabled={loading}>
        {loading ? <Spinner /> : '🔑 Vérifier avec ma clé de sécurité'}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        <button
          type="button"
          className="underline underline-offset-2 hover:text-foreground"
          onClick={() => navigate('/login', { replace: true })}
        >
          Retour à la connexion
        </button>
      </p>
    </div>
  )
}
