import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

import logo from '/atacc_logo.png'
import { useState } from "react"
import type { AxiosError } from "axios";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircleIcon } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate, useLocation } from "react-router-dom"
import { startAuthentication } from "@simplewebauthn/browser"
import { apiRequest } from "@/services/api"

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [isPasskeyLoading, setPasskeyLoading] = useState(false);
  const { login, refreshAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true)

    if (!username || !password) {
      setError('Veuillez remplir tous les champs.');
      setLoading(false);
      return;
    }

    try {
      const result = await login({ username, password })

      if (result.requiresMfa) {
        // Rediriger vers le challenge MFA en passant la méthode et la destination
        const from = (location.state as { from?: string })?.from || '/admin'
        navigate('/mfa-challenge', { state: { method: result.mfaMethod, from } })
        return
      }

      const from = (location.state as { from?: string })?.from || '/admin'
      navigate(from, { replace: true })
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>;
      setError(error.response?.data?.error || "Erreur de connexion");
    } finally {
      setLoading(false)
    }
  }

  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true)
    setError(null)

    try {
      // Obtenir le challenge discoverable
      const { data } = await apiRequest.get('/auth/passkey/challenge')
      const { challengeId, ...optionsJSON } = data

      // Déclencher le sélecteur natif de passkeys
      const assertion = await startAuthentication({ optionsJSON })

      // Envoyer la réponse signée + challengeId au serveur
      await apiRequest.post('/auth/passkey/verify', { challengeId, ...assertion })

      //  Session cookie posé — hydrater le contexte
      const from = (location.state as { from?: string })?.from || '/admin'
      const { requiresOnboarding } = await refreshAuth()
      navigate(requiresOnboarding ? '/onboarding' : from, { replace: true })
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        setError('Authentification annulée.')
      } else {
        const axiosErr = err as AxiosError<{ error?: string }>
        setError(axiosErr.response?.data?.error ?? 'Authentification passkey échouée. Réessayez.')
      }
    } finally {
      setPasskeyLoading(false)
    }
  }

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader>
          <div className="flex flex-col items-center gap-2 text-center">
            <a>
              <div className="flex size-12 items-center justify-center rounded-md">
                <img src={logo} alt="atacc logo" />
              </div>
            </a>
            <h1 className="text-xl font-bold">Bienvenue sur l'ATACCothèque</h1>
            <FieldDescription>
              Vous n'avez pas de compte ? Demandé en un à un administrateur
            </FieldDescription>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel>Nom d'utilisation</FieldLabel>
                <Input 
                  id="username"
                  type="text"
                  placeholder="Admin"
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Mot de passe</FieldLabel>
                <Input 
                  id="password"
                  type="password"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Field>
                <Button 
                type="submit"
                disabled={isLoading}
                >
                  {isLoading
                    ? <Spinner />
                  :"Se connecter"}
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Ou continuer avec
              </FieldSeparator>
              <Field>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handlePasskeyLogin}
                  disabled={isPasskeyLoading}
                >
                  {isPasskeyLoading ? <Spinner /> : '🔑 Se connecter avec une passkey'}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}