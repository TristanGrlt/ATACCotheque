import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

import logo from '/atacc_logo.png'

export function Login() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <Card className="w-full max-w-sm">
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
        </CardHeader>
        <CardContent>
          <form>
            <FieldGroup>
              <Field>
                <FieldLabel>Nom d'utilisation</FieldLabel>
                <Input 
                  id="username"
                  type="text"
                  placeholder="Admin"
                />
              </Field>
              <Field>
                <FieldLabel>Mot de passe</FieldLabel>
                <Input 
                  id="password"
                  type="password"
                />
              </Field>
              <Field>
                <Button type="submit">Se connecter</Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}