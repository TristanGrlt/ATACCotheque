export const PERMISSIONS = {
  MANAGE_USERS: 'MANAGE_USERS',
  MANAGE_PEDAGO: "MANAGE_PEDAGO",
  MANAGE_EXAMS: "MANAGE_EXAMS",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

export const PERMISSION_DETAILS: Record<
  PermissionKey,
  { label: string; description: string }
> = {
  MANAGE_PEDAGO: {
    label: "Gestion pédagogique",
    description: "Permet de gérer les parcours, niveaux, cours et examens.",
  },
  MANAGE_EXAMS: {
    label: "Gestion des examens",
    description: "Permet de valider/gérer les annales et annexes.",
  },
  MANAGE_USERS: {
    label: "Gestion des utilisateurs",
    description: "Permet de voir, modifier ou supprimer des utilisateurs."
  },
};
