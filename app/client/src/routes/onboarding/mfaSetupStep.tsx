import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"
import { Separator } from "@/components/ui/separator"
import { apiRequest, getRequestMessage } from "@/services/api"
import { useState } from "react"
import { toast } from "sonner"

export default function MFASetupStep({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState<'choice' | 'totp-scan' | 'totp-verify'>('choice')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleTOTPInit = async () => {
    setLoading(true)
    try {
      const { data } = await apiRequest.post('/onboarding/totp/init')
      setQrCode(data.qrCode)
      setSecret(data.secret)
      setStep('totp-scan')
    } catch (err: any) {
      toast.error(`Erreur lors de l\'initialisation : ${getRequestMessage(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleTOTPVerify = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await apiRequest.post('/onboarding/totp/verify', { code })
      setBackupCodes(data.backupCodes)
      setStep('totp-verify')
    } catch (err: any) {
      toast.error(`Code incorrect : ${getRequestMessage(err)}`)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'choice') {
    return (
      <>
        <h2 className="text-xl font-semibold mb-4">Étape 2 : Double authentification</h2>
        <p className="mb-6 text-muted-foreground">
          Choisissez une méthode de double authentification pour sécuriser votre compte.
        </p>
        <div className="space-y-3">
          <Button onClick={handleTOTPInit} disabled={loading} className="w-full">
            📱 Application d'authentification (TOTP)
          </Button>
          
          <Button variant="outline" className="w-full" disabled>
            🔑 Clé de sécurité (WebAuthn)
          </Button>
        </div>
      </>
    )
  }

  if (step === 'totp-scan') {
    return (
      <>
        <h2 className="text-xl font-semibold mb-4">Scannez le QR code</h2>
        <p className="mb-6 text-muted-foreground">
          Utilisez une app comme Google Authenticator, Authy ou 1Password.
        </p>

        <div className="text-center mb-6">
          <img src={qrCode} alt="QR Code" className="mx-auto" />
          <p className="text-sm text-muted-foreground mt-2 text-wrap wrap-break-word">Ou entrez manuellement : {secret}</p>
        </div>

        <Separator className="mb-6"/>

        <form onSubmit={handleTOTPVerify} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Code de vérification</FieldLabel>
                <div className="flex justify-center">
                <InputOTP maxLength={6} value={code} onChange={setCode} >
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
            </Field>
            <Field>
              <Button type="submit" disabled={loading}>
                {loading ? 'Vérification...' : 'Vérifier'}
              </Button>
            </Field>
          </FieldGroup>
          
        </form>
      </>
    )
  }

  if (step === 'totp-verify') {
    return (
      <>
      <h2 className="text-xl font-semibold mb-4">✅ 2FA activée !</h2>
      <p className="mb-6 text-muted-foreground">
        Voici vos codes de secours. <strong>Sauvegardez-les dans un endroit sûr</strong>.
      </p>
      <div className="bg-gray-100 p-4 rounded mb-4 font-mono text-sm grid grid-cols-2 gap-2">
        {backupCodes.map((code, i) => (
          <div key={i}>{code}</div>
        ))}
      </div>
      <Button onClick={onSuccess} className="w-full">
        J'ai sauvegardé mes codes
      </Button>
      </>
    )
  }

}