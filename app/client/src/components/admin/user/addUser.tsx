import { useState } from "react";
import { Button } from "../../ui/button";
import { UserFormDialog } from "./userFormDialog";
import type { User } from "@/routes/admin/user/columnsUser";

type AddUserProps = {
  onUserCreated?: (user: User) => void
}

export function AddUser({ onUserCreated }: AddUserProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        + Ajouter un utilisateur
      </Button>
      <UserFormDialog
        mode="create"
        open={open}
        onOpenChange={setOpen}
        onUserSaved={onUserCreated}
        title="Créer un nouveau utilisateur"
        description="Remplisez les champs si dessous pour créer un nouvelle utilisateur. Le mot de passe renseigné devra être changer par l'utilisateur lors de sa première connexion"
      />
    </>
  )
}