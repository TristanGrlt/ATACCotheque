export const PERMISSIONS = {
  MANAGE_USERS: "MANAGE_USERS",
  MANAGE_PEDAGO: "MANAGE_PEDAGO",
  MANAGE_ROLES: 'MANAGE_ROLES',
  REVIEW_ANNALES: 'REVIEW_ANNALES',
  MANAGE_ANNALES: 'MANAGE_ANNALES',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

export const PERMISSION_DETAILS: Record<
  PermissionKey,
  { label: string; description: string }
> = {
  MANAGE_USERS: {
    label: "Gestion des utilisateurs",
    description: "Permet de voir, modifier ou supprimer des utilisateurs.",
  },
  MANAGE_PEDAGO: {
    label: "Gestion pédagogique",
    description: "Permet de gérer les parcours, niveaux, cours et examens.",
  },
  MANAGE_ROLES: {
    label: "Gestion des rôles",
    description: "Permet de créer, éditer et supprimer des rôles et leurs permissions."
  },
  REVIEW_ANNALES: {
    label: "Revue des annales",
    description: "Donne le droit d'accepter ou rejeter de nouveaux documents/annales."
  },
  MANAGE_ANNALES: {
    label: "Gestion des annales",
    description: "Permet de voir, créer, modifier et supprimer des annales/examens."
  }
};
