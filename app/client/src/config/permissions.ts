export const PERMISSIONS = {
  MANAGE_USERS: 'MANAGE_USERS',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

export const PERMISSION_DETAILS: Record<PermissionKey, { label: string; description: string }> = {
  MANAGE_USERS: {
    label: "Gestion des utilisateurs",
    description: "Permet de voir, modifier ou supprimer des utilisateurs."
  },
};
