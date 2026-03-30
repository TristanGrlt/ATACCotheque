import {
  Contact,
  LayoutGrid,
  Library,
  Plus,
  type LucideIcon,
} from "lucide-react";

export interface NavbarItem {
  title: string;
  url: string;
  onDoubleClick?: () => void;
  icon: LucideIcon;
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
    title: "Contact",
    url: "/contact",
    icon: Contact,
  },
  {
    title: "Ajouter",
    url: "/upload",
    icon: Plus,
  },

];
