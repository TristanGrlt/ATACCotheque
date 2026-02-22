import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircleIcon } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { apiRequest } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

interface TotpChallengeProps {
  redirectTo: string
}

export function TotpChallenge({ redirectTo }: TotpChallengeProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { refreshAuth } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) return

    setLoading(true)
    setError(null)

    try {
      await apiRequest.post('/user/mfa/verify', { code })
      const { requiresOnboarding } = await refreshAuth()
      navigate(requiresOnboarding ? '/onboarding' : redirectTo, { replace: true })
    } catch (err: any) {
      setCode('')
      setError(err.response?.data?.error ?? 'Code invalide. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-muted-foreground text-center">
        Entrez le code à 6 chiffres affiché dans votre application d'authentification.
      </p>

      <div className="flex justify-center">
        <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
        {loading ? <Spinner /> : 'Vérifier'}
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
    </form>
  )
}
