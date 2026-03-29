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

// --- Enhanced Color Palettes for styling ---
// Includes backgrounds, text colors, subtle borders, and hover states with modern dark mode opacities.
const COLOR_PALETTES = [
  "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 dark:hover:bg-blue-900/60",
  "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 dark:hover:bg-emerald-900/60",
  "bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/60 dark:hover:bg-violet-900/60",
  "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 dark:hover:bg-amber-900/60",
  "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 dark:hover:bg-rose-900/60",
  "bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/60 dark:hover:bg-cyan-900/60",
  "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 hover:bg-fuchsia-100 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:border-fuchsia-800/60 dark:hover:bg-fuchsia-900/60",
  "bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60 dark:hover:bg-teal-900/60",
  "bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60 dark:hover:bg-orange-900/60",
  "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60 dark:hover:bg-indigo-900/60",
  "bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800/60 dark:hover:bg-pink-900/60",
  "bg-lime-50 text-lime-700 border border-lime-200 hover:bg-lime-100 dark:bg-lime-950/40 dark:text-lime-300 dark:border-lime-800/60 dark:hover:bg-lime-900/60",
  "bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60 dark:hover:bg-sky-900/60",
  "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60 dark:hover:bg-purple-900/60",
  "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60 dark:hover:bg-red-900/60",
  "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-950/40 dark:text-slate-300 dark:border-slate-800/60 dark:hover:bg-slate-900/60",
];

/**
 * Get color palette based on a string key (major name)
 * Uses a classic 31-multiplier string hash to better distribute colors
 * and avoid grouping words of similar lengths together.
 */
export const getColorFromId = (key: string): string => {
  if (!key) return COLOR_PALETTES[0];

  const hash = key.split("").reduce((acc, char) => {
    const hashVal = (acc << 5) - acc + char.charCodeAt(0);
    return hashVal | 0;
  }, 0);

  return COLOR_PALETTES[Math.abs(hash) % COLOR_PALETTES.length];
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
