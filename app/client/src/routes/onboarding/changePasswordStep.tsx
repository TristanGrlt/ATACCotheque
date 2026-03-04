import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { apiRequest, getRequestMessage } from "@/services/api"
import { AlertCircleIcon, Eye, EyeClosed } from "lucide-react"
import { useState } from "react"

export default function ChangePasswordStep({ onSuccess }: { onSuccess: () => void }) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isPasswordVisible2, setPasswordVisible2] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setLoading(true)
    try {
      await apiRequest.post('/onboarding/password-change', {
        oldPassword,
        newPassword
      })
      onSuccess()
    } catch (err: any) {
      setError(`Erreur lors du changement de mot de passe : ${getRequestMessage(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Étape 1 : Changement de mot de passe</h2>
      <p className="mb-6 text-muted-foreground">
        Pour des raisons de sécurité, vous devez changer votre mot de passe initial.
      </p>
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="pt-4">
        <FieldGroup>
          <Field>
            <FieldLabel>Mot de passe actuel</FieldLabel>
            <Input
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel>Nouveau mot de passe</FieldLabel>
            <ButtonGroup>
              <Input
                id="newPassword"
                type={isPasswordVisible ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
              <Button
                variant="outline"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setPasswordVisible(!isPasswordVisible);
                }}
              >
                {!isPasswordVisible ? <EyeClosed /> : <Eye />}
              </Button>
            </ButtonGroup>
          </Field>
          <Field>
            <FieldLabel>Confirmer le mot de passe</FieldLabel>
            <ButtonGroup>
              <Input
                id="confirmPassword"
                type={isPasswordVisible2 ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button
                variant="outline"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setPasswordVisible2(!isPasswordVisible2);
                }}
              >
                {!isPasswordVisible2 ? <EyeClosed /> : <Eye />}
              </Button>
            </ButtonGroup>
          </Field>
          <Field>
            <Button 
            type="submit"
            disabled={loading}
            >
              {loading
                ? <Spinner />
              :"Changer le mot de passe"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </>
  )
}