import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Field, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { Spinner } from "../ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircleIcon, Eye, EyeClosed } from "lucide-react";
import { apiRequest } from "@/services/api";
import { ButtonGroup } from "../ui/button-group";
import { toast } from "sonner";

export function AddUser() {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [password2, setPassword2] = useState('');
  const [isPasswordVisible2, setPasswordVisible2] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (!username || !password || !password2) {
      setError('Veuillez remplir tous les champs.');
      setLoading(false);
      return;
    }

    if (password !== password2) {
      setError('Les deux mots de passe ne sont pas identique');
      setLoading(false);
      return;
    }

    try {
      const { data } = await apiRequest.post("/user/signup", {username, password})
      toast(`L'utilisateur "${data.username}" à bien été ajouté`)
    } catch (err) {
      console.error("error");
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          + Ajouter un utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Créer un nouveau utilisateur
            </DialogTitle>
            <DialogDescription>
              Remplisez les champs si dessous pour créer un nouvelle utilisateur.
              Le mot de passe renseigné devra être changer par l'utilisateur lors de sa première connexion
            </DialogDescription>
            {error && (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </DialogHeader>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="input-required">
                    Nom d'utilisation
                    <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input 
                    id="username"
                    type="text"
                    placeholder="Admin"
                    required
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="input-required">
                    Mot de passe
                    <span className="text-destructive">*</span>
                  </FieldLabel>
                  <ButtonGroup>
                    <Input 
                      id="password"
                      type={isPasswordVisible ? "text" : "password"}
                      required
                      placeholder="••••••••" 
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button variant="outline" 
                          onClick={(e) => {e.preventDefault(); setPasswordVisible(!isPasswordVisible)}}>
                            {isPasswordVisible ? (<EyeClosed />) : (<Eye />)}
                    </Button>
                  </ButtonGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="input-required">
                    Réécrire le mot de passe
                    <span className="text-destructive">*</span>
                  </FieldLabel>
                  <ButtonGroup>
                      <Input 
                        id="password"
                        type={isPasswordVisible2 ? "text" : "password"}
                        required
                        placeholder="••••••••" 
                        onChange={(e) => setPassword2(e.target.value)}
                      />
                      <Button variant="outline" 
                        onClick={(e) => {e.preventDefault(); setPasswordVisible2(!isPasswordVisible2)}}>
                          {isPasswordVisible2 ? (<EyeClosed />) : (<Eye />)}
                      </Button>
                  </ButtonGroup>
                </Field>
                <Field>
                  <Button 
                  type="submit"
                  disabled={isLoading}
                  >
                    {isLoading
                      ? <Spinner />
                    :"Valider"}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
      </DialogContent>
    </Dialog>
  )
}