import React, { useState, useEffect, useRef } from "react";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Field, FieldGroup, FieldLabel } from "../../ui/field";
import { Input } from "../../ui/input";
import { Spinner } from "../../ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "../../ui/alert";
import { AlertCircleIcon, Eye, EyeClosed } from "lucide-react";
import { apiRequest, getRequestMessage } from "@/services/api";
import { ButtonGroup } from "../../ui/button-group";
import { toast } from "sonner";
import type { User } from "@/routes/admin/user/columnsUser";
import type { Role } from "@/routes/admin/user/columnsRole";
import { 
  Combobox, 
  ComboboxChip, 
  ComboboxChips, 
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue, 
  useComboboxAnchor 
} from "@/components/ui/combobox";
import { UserBadge } from "@/components/userBadge";

type UserFormDialogProps = {
  mode: 'create' | 'edit';
  user?: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserSaved?: (user: User) => void;
  title: string;
  description: string;
}

export function UserFormDialog({
  mode,
  user,
  open,
  onOpenChange,
  onUserSaved,
  title,
  description,
}: UserFormDialogProps) {
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [password2, setPassword2] = useState('');
  const [isPasswordVisible2, setPasswordVisible2] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const hasLoadedRoles = useRef(false);
  const isResettingRef = useRef(false);

  // Charger les rôles une seule fois
  useEffect(() => {
    if (!hasLoadedRoles.current) {
      apiRequest.get('/role')
        .then(response => {
          setAvailableRoles(response.data.data || []);
          hasLoadedRoles.current = true;
        })
        .catch(err => {
          console.error('Failed to fetch roles:', err);
        });
    }
  }, []);

  // Réinitialiser le formulaire quand la modale s'ouvre (ou que l'utilisateur change)
  useEffect(() => {
    if (open) {
      isResettingRef.current = true;
      setUsername(user?.username || '');
      setPassword('');
      setPassword2('');
      setPasswordVisible(false);
      setPasswordVisible2(false);
      setError(null);
      const roles = user?.roles ? user.roles.map(role => role.name) : [];
      setSelectedRoles(roles);
      // Marquer la fin du reset après un court délai pour éviter fermetures involontaires
      setTimeout(() => {
        isResettingRef.current = false;
      }, 100);
    }
  }, [open, user?.id]);

  const handleOpenChange = (newOpen: boolean) => {
    // Ignorer les appels à handleOpenChange pendant la réinitialisation
    if (isResettingRef.current && !newOpen) {
      return;
    }
    onOpenChange(newOpen);
  };

  const anchor = useComboboxAnchor()

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (mode === 'create') {
      if (!username || !password || !password2) {
        setError('Veuillez remplir tous les champs.');
        setLoading(false);
        return;
      }

      if (password !== password2) {
        setError('Les deux mots de passe ne sont pas identiques');
        setLoading(false);
        return;
      }

      if(selectedRoles.length === 0) {
        setError('Veuillez sélectionner au moins un rôle.');
        setLoading(false);
        return;
      }
    } else {
      if (!username) {
        setError('Veuillez entrer un nom d\'utilisateur.');
        setLoading(false);
        return;
      }

      if (password || password2) {
        if (!password || !password2) {
          setError('Les deux mots de passe doivent être remplis.');
          setLoading(false);
          return;
        }

        if (password !== password2) {
          setError('Les deux mots de passe ne sont pas identiques');
          setLoading(false);
          return;
        }
      }

      if(selectedRoles.length === 0) {
        setError('Veuillez sélectionner au moins un rôle.');
        setLoading(false);
        return;
      }
    }

    try {
      let response;
      const roleIds = availableRoles
        .filter(role => selectedRoles.includes(role.name))
        .map(role => role.id);

      if (mode === 'create') {
        response = await apiRequest.post('/user/signup', {
          username,
          password,
          roleIds,
        });
      } else {
        const updateData: { username: string; password?: string; roleIds: number[] } = { 
          username,
          roleIds,
        };
        if (password) {
          updateData.password = password;
        }
        response = await apiRequest.put(`/user/${user?.id}`, updateData);
      }

      const { data } = response;
      onUserSaved?.(data);
      handleOpenChange(false);
      toast(`L'utilisateur "${data.username}" à bien été ${mode === 'create' ? 'ajouté' : 'modifié'}`);
    } catch (err) {
      setError(getRequestMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={false}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
              <FieldLabel htmlFor="username">
                Nom d'utilisation
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="username"
                type="text"
                placeholder="Admin"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">
                Mot de passe
                {mode === 'create' && <span className="text-destructive">*</span>}
                {mode === 'edit' && <span className="text-muted-foreground text-sm"> (optionnel)</span>}
              </FieldLabel>
              <ButtonGroup>
                <Input
                  id="password"
                  type={isPasswordVisible ? "text" : "password"}
                  required={mode === 'create'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  variant="outline"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setPasswordVisible(!isPasswordVisible);
                  }}
                >
                  {isPasswordVisible ? <EyeClosed /> : <Eye />}
                </Button>
              </ButtonGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="password2">
                Réécrire le mot de passe
                {mode === 'create' && <span className="text-destructive">*</span>}
                {mode === 'edit' && <span className="text-muted-foreground text-sm"> (optionnel)</span>}
              </FieldLabel>
              <ButtonGroup>
                <Input
                  id="password2"
                  type={isPasswordVisible2 ? "text" : "password"}
                  required={mode === 'create'}
                  placeholder="••••••••"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                />
                <Button
                  variant="outline"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setPasswordVisible2(!isPasswordVisible2);
                  }}
                >
                  {isPasswordVisible2 ? <EyeClosed /> : <Eye />}
                </Button>
              </ButtonGroup>
            </Field>
            <Field>
              <FieldLabel>Rôle
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Combobox
                multiple
                openOnInputClick
                items={Array.isArray(availableRoles) ? availableRoles.map(role => role.name) : []}
                value={selectedRoles}
                onValueChange={(newValue) => {
                  console.log('Value changed:', newValue);
                  setSelectedRoles(newValue as string[]);
                }}
              >
                <ComboboxChips ref={anchor} className="w-full">
                  <ComboboxValue>
                    {selectedRoles.map((value: string) => {
                      const role = availableRoles.find(r => r.name === value);
                      return (
                        <ComboboxChip key={value} className="bg-transparent p-0 border-0 h-auto">
                          <UserBadge text={value} color={role?.color || '#808080'} />
                        </ComboboxChip>
                      );
                    })}
                  </ComboboxValue>
                  <ComboboxChipsInput placeholder={selectedRoles.length === 0 ? "Sélectionner des rôles..." : undefined} />
                </ComboboxChips>
                <ComboboxContent anchor={anchor}>
                  <ComboboxEmpty>Aucun rôle trouvé.</ComboboxEmpty>
                  <ComboboxList>
                    {(item) => {
                      const role = availableRoles.find(r => r.name === item);
                      return (
                        <ComboboxItem key={item} value={item}>
                          <UserBadge text={item} color={role?.color || '#808080'} />
                        </ComboboxItem>
                      );
                    }}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </Field>
            <Field>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Spinner /> : "Valider"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
