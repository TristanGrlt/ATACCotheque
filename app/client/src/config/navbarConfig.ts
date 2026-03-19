import { LayoutGrid, Library, Target, Plus } from "lucide-react";
import type { ReactNode } from "react";

export interface NavbarItem {
  title: string;
  url: string;
  onDoubleClick?: () => void;
  icon: ReactNode;
}

export const NAVBAR_ITEMS: NavbarItem[] = [
  {
    title: "Accueil",
    url: "/",
    icon: LayoutGrid,
    onDoubleClick: () => {
      window.location.href = "/login";
    },
  },
  {
    title: "Bibliothèque",
    url: "/search",
    icon: Library,
  },
  {
    title: "Manquants",
    url: "/missing",
    icon: Target,
  },
  {
    title: "Ajouter",
    url: "/upload",
    icon: Plus,
  },
];
