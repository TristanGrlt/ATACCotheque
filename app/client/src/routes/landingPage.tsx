import { Link } from "react-router-dom";
import {
  Atom,
  FlaskConical,
  LayoutGrid,
  Library,
  Plus,
  Search,
  Sigma,
  Target,
  Terminal,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";

export function LandingPage() {
  return (
    <>
      <div className="min-h-screen bg-background pb-28 font-sans text-foreground selection:bg-primary/20">
        <div className="text-center mb-8 pt-10 px-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight leading-tight">
            Vos annales <span className="text-primary">partout !</span>
          </h1>
          <p className="text-base text-muted-foreground mb-8 max-w-xl mx-auto">
            La plateforme collaborative de l'ATACC. <br className="sm:hidden" />
            Annales et corrigés gratuits.
          </p>
        </div>

        {/* --- Barre de recherche --- */}
        <div className="w-full max-w-xl mx-auto px-4 mt-2 relative">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-muted-foreground w-5 h-5" />
            </div>
            <Input
              type="text"
              className="pl-12"
              placeholder="Chercher un cours..."
            />
          </div>
        </div>

        {/* --- Grille des Matières --- */}
        <div className="max-w-xl mx-auto px-4 mt-10">
          <h2 className="text-lg font-bold mb-4 text-foreground">Matières</h2>

          {/* Grille : 2 colonnes sur téléphone, 4 sur tablette/PC */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Informatique */}
            <Card className="p-4 rounded-2xl cursor-pointer text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-primary/10 text-primary">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-foreground">Info</h3>
              <p className="text-xs text-muted-foreground">128 fichiers</p>
            </Card>

            {/* Mathématiques */}
            <Card className="p-4 rounded-2xl cursor-pointer text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-amber-50 text-amber-500">
                <Sigma className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-foreground">Maths</h3>
              <p className="text-xs text-muted-foreground">84 fichiers</p>
            </Card>

            {/* Physique */}
            <Card className="p-4 rounded-2xl cursor-pointer text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-rose-50 text-rose-500">
                <Atom className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-foreground">Physique</h3>
              <p className="text-xs text-muted-foreground">65 fichiers</p>
            </Card>

            {/* Chimie */}
            <Card className="p-4 rounded-2xl cursor-pointer text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-emerald-50 text-emerald-500">
                <FlaskConical className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-foreground">Chimie</h3>
              <p className="text-xs text-muted-foreground">42 fichiers</p>
            </Card>
          </div>
        </div>

        <nav className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 rounded-2xl p-2 flex justify-around sm:gap-2 items-center bg-background/90 backdrop-blur-xl border border-border shadow-2xl">
          {/* Bouton Accueil - État Actif */}
          <Link to="/">
            <Button className="flex-1 sm:flex-none h-12 sm:w-12 rounded-xl sm:rounded-full">
              <LayoutGrid className="w-6 h-6" />
            </Button>
          </Link>

          <div className="w-px h-6 bg-border mx-1 hidden sm:block"></div>

          {/* Bouton Bibliothèque - État Inactif */}
          <Link to="/search">
            <Button
              variant="ghost"
              className="flex-1 sm:flex-none h-12 sm:w-12 rounded-xl sm:rounded-full"
            >
              <Library className="w-6 h-6" />
            </Button>
          </Link>

          {/* Bouton Manquants - État Inactif */}
          <Button
            variant="ghost"
            className="flex-1 sm:flex-none h-12 sm:w-12 rounded-xl sm:rounded-full"
          >
            <Target className="w-6 h-6" />
          </Button>

          {/* Bouton Upload - État Inactif */}
          <Link to="/upload">
            <Button
              variant="ghost"
              className="flex-1 sm:flex-none h-12 sm:w-12 rounded-xl sm:rounded-full"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </Link>
        </nav>
      </div>
    </>
  );
}
