import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Role } from "@/routes/admin/user/columnsRole";
import { AlertCircleIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { PERMISSION_DETAILS, type PermissionKey } from "@/config/permissions";
import { apiRequest, getRequestMessage } from "@/services/api";
import { toast } from "sonner";

type RoleFormDialogProps = {
  mode: 'create' | 'edit';
  role?: Role & { permissions?: PermissionKey[] };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleSaved?: (role: Role) => void;
  title: string;
  description: string;
}

export function RoleFormDialog({
  mode,
  role,
  open,
  onOpenChange,
  onRoleSaved,
  title,
  description,
}: RoleFormDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [name, setName] = useState(role?.name || '');
  const [color, setColor] = useState(role?.color || '#e94e1b');
  // Initialize with role permissions if editing, or empty if creating
  const [selectedAccessRights, setSelectedAccessRights] = useState<PermissionKey[]>(
    (role?.permissions as PermissionKey[]) || []
  );

  useEffect(() => {
    if (open) {
      if (role) {
        setName(role.name);
        setColor(role.color);
        setSelectedAccessRights((role.permissions as PermissionKey[]) || []);
      } else {
        setName('');
        setColor('#e94e1b');
        setSelectedAccessRights([]);
      }
      setError(null);
    }
  }, [role, open]);

  const handleAccessRightChange = (key: PermissionKey, checked: boolean) => {
    setSelectedAccessRights(prev => 
      checked 
        ? [...prev, key]
        : prev.filter(k => k !== key)
    );
  }

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (!name) {
      setError('Veuillez entrer un nom de rôle.');
      setLoading(false);
      return;
    }

    try {
      let response;
      if (mode === 'create') {
        response = await apiRequest.post('/role', {
          name,
          color,
          permissions: selectedAccessRights,
        });
      } else {
        const updateData: { name: string; color: string; permissions: PermissionKey[] } = { name, color, permissions: selectedAccessRights };
        response = await apiRequest.put(`/role/${role?.id}`, updateData);
      }

      const { data } = response;
      onRoleSaved?.(data);
      handleOpenChange(false);
      toast(`Le rôle "${data.name}" à bien été ${mode === 'create' ? 'ajouté' : 'modifié'}`);
    } catch (err) {
      setError(getRequestMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return(
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
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
          <div className="flex flex-col gap-4 py-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">
                  Nom du rôle
                  <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="Mon role"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>
                  Couleur du rôle
                  <span className="text-muted-foreground text-sm"> (optionnel)</span>
                </FieldLabel>
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    setColor(e.target.value)
                  }}
                />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Permissions</FieldLabel>
              <ScrollArea className="h-96 w-full rounded-md border p-4 [&_[data-radix-scroll-area-viewport]]:scrollbar-visible">
                <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
                  {(Object.entries(PERMISSION_DETAILS) as [PermissionKey, typeof PERMISSION_DETAILS[PermissionKey]][]).map(([key, details]) => (
                    <FieldLabel key={key}>
                      <Field orientation="horizontal" className="gap-2">
                        <Checkbox 
                          id={`toggle-checkbox-${key}`} 
                          name={`toggle-checkbox-${key}`}
                          checked={selectedAccessRights.includes(key)}
                          onCheckedChange={(checked) => handleAccessRightChange(key, checked as boolean)}
                        />
                        <FieldContent>
                          <FieldTitle className="text-sm">{details.label}</FieldTitle>
                          <FieldDescription className="text-xs">
                            {details.description || 'No description'}
                          </FieldDescription>
                        </FieldContent>
                      </Field>
                    </FieldLabel>
                  ))}
                </div>
              </ScrollArea>
            </FieldGroup>

            <Field>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Spinner /> : "Valider"}
              </Button>
            </Field>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}