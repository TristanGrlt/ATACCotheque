import { useState } from "react";
import { Button } from "../../ui/button";
import { RoleFormDialog } from "./roleFormDialog";
import type { Role } from "@/routes/admin/user/columnsRole";

type AddRoleProps = {
  onRoleCreated?: (role: Role) => void
}

export function AddRole({ onRoleCreated }: AddRoleProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        + Ajouter un rôle
      </Button>
      <RoleFormDialog
        mode="create"
        open={open}
        onOpenChange={setOpen}
        onRoleSaved={onRoleCreated}
        title="Créer un nouveau Rôle"
        description="Remplisez les champs si dessous pour créer un nouveau rôle"
      />
    </>
  )
}