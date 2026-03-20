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
