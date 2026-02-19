import { Loading } from "@/components/loading"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Toaster } from "@/components/ui/sonner"
import { useAuth } from "@/contexts/AuthContext"
import { apiRequest } from "@/services/api"
import { use, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import ChangePasswordStep from "./changePasswordStep"
import MFASetupStep from "./mfaSetupStep"


interface OnboardingStatus {
  isFirstLogin: boolean
  onboardingComplete: boolean
  Steps: {
    passwordChange: {
      required: boolean
      completed: boolean
    }
    mfaSetup: {
      required: boolean
      completed: boolean
      methode: string // 'totp' or 'webauthn'
    }
  }
}

export default function OnboardingPage() {
  const [status, setStatus ] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchStatus();
  }, [isAuthenticated, navigate]);

  const handleSuccess = async () => {
    await fetchStatus()
    await login() // Rafraîchir le token
  }

  const fetchStatus = async () => {
    try {
      const { data } = await apiRequest.get('/onboarding/status');
      setStatus(data);
      if (data.onboardingComplete) {
        navigate('/');
        return;
      }
    } catch (err) {
      toast.error('Erreur lors de la récupération du statut');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Loading />
  }

  if (!status) {
    return <div className="text-center text-red-500">Impossible de récupérer le statut d'onboarding.</div>
  }


  return (
    <>
      <Toaster />
      <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <Card className="w-full max-w-3xl shadow-xl">
          <CardHeader>
            <h1 className="text-3xl font-bold">Configuration de votre compte</h1>
          </CardHeader>
          <CardContent>
            {status.Steps.passwordChange.required && !status.Steps.passwordChange.completed && (
            <ChangePasswordStep onSuccess={handleSuccess} />
            )}
            {status.Steps.passwordChange.completed && 
            status.Steps.mfaSetup.required && 
            !status.Steps.mfaSetup.completed && (
              <MFASetupStep onSuccess={handleSuccess} />
              //<div className="text-center text-blue-500">Étape suivante : configuration de la MFA (en cours de développement)</div>
            )}
          </CardContent>

        </Card>
      </div>
    </>
  );
}