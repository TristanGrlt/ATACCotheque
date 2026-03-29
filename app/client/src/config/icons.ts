import {
  // Sciences & Tech
  Sigma,
  Atom,
  FlaskConical,
  Microscope,
  Terminal,
  Code,
  Database,
  Calculator,
  Cpu,
  Dna,
  Telescope,

  // Lettres & Langues
  Book,
  BookOpen,
  Languages,
  PenTool,
  Quote,

  // Sciences Humaines & Sociale
  Globe,
  Gavel,
  Landmark,
  Users,
  Brain,
  History,

  // Arts & Design
  Palette,
  Music,
  Camera,
  Drama,

  // Business & Économie
  ChartLine,
  Briefcase,
  Coins,
  FileText,
} from "lucide-react";

export const MajorIconMap: Record<string, React.ElementType> = {
  // --- SCIENCES EXACTES ---
  Mathématiques: Sigma,
  Physique: Atom,
  Chimie: FlaskConical,
  Biologie: Dna,
  Médecine: Microscope,
  Astronomie: Telescope,

  // --- TECH & INFO ---
  Informatique: Code,
  Systemes: Terminal,
  DataScience: Database,
  Ingénierie: Cpu,
  Statistiques: Calculator,

  // --- LETTRES & LANGUES ---
  Littérature: Book,
  LanguesEtrangeres: Languages,
  Philosophie: Quote,
  Ecriture: PenTool,
  Philologie: BookOpen,

  // --- SCIENCES HUMAINES ---
  Géographie: Globe,
  Droit: Gavel,
  SciencesPolitiques: Landmark,
  Psychologie: Brain,
  Sociologie: Users,
  Histoire: History,
  Économie: ChartLine,

  // --- ARTS & PRO ---
  ArtsPlastiques: Palette,
  Musique: Music,
  Cinema: Camera,
  Theatre: Drama,
  Business: Briefcase,
  Finance: Coins,
};

// --- Color Palettes for styling ---
const COLOR_PALETTES = [
  "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
  "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
  "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400",
  "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400",
  "bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400",
  "bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400",
  "bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400",
  "bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400",
];

/**
 * Get color palette based on a string key (major name)
 * Uses consistent hashing to ensure the same major always gets the same color
 */
export const getColorFromId = (key: string): string => {
  if (!key) return COLOR_PALETTES[0];
  const hash = key.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLOR_PALETTES[hash % COLOR_PALETTES.length];
};

/**
 * Get icon component by name
 * Falls back to FileText if icon name not found
 */
export const getIconByName = (iconName?: string): React.ElementType => {
  if (!iconName || !(iconName in MajorIconMap)) {
    return FileText;
  }
  return MajorIconMap[iconName as keyof typeof MajorIconMap];
};
