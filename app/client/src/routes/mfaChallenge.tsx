import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { TotpChallenge } from '@/components/mfa/TotpChallenge'
import { WebAuthnChallenge } from '@/components/mfa/WebAuthnChallenge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import logo from '/atacc_logo.png'

interface MfaChallengeState {
  method?: 'totp' | 'webauthn'
  from?: string
}

export function MfaChallenge() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { method, from = '/admin' } = (state as MfaChallengeState) ?? {}

  // Si déjà authentifié (session cookie présent) ou pas de méthode : rediriger
  useEffect(() => {
    if (isAuthenticated || !method) {
      navigate(isAuthenticated ? from : '/login', { replace: true })
    }
  }, [isAuthenticated, method])

  if (!method) return null

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-12 items-center justify-center rounded-md">
              <img src={logo} alt="atacc logo" />
            </div>
            <h1 className="text-xl font-bold">Vérification en deux étapes</h1>
          </div>
        </CardHeader>
        <CardContent>
          {method === 'totp' && <TotpChallenge redirectTo={from} />}
          {method === 'webauthn' && <WebAuthnChallenge redirectTo={from} />}
        </CardContent>
      </Card>
    </div>
  )
}
