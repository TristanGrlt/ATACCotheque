import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Eye,
  FileText,
  ExternalLink,
  CheckCircle2,
  Moon,
  Sun,
  Plus,
  Instagram,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { useTheme } from "../components/theme-provider";
import { apiRequest } from "../services/api";
import { getIconByName } from "../config/icons";

const colorPalettes = [
  "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
  "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
  "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400",
  "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400",
  "bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400",
  "bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400",
  "bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400",
  "bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400",
];

const getColorFromId = (key: string) => {
  const hash = key.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colorPalettes[hash % colorPalettes.length];
};

type Stats = {
  subjects: Subject[];
  totalPastExams: number;
};

type Subject = {
  name: string;
  icon: string | null;
  pastExamCount: number;
};

export function LandingPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [titleClicks, setTitleClicks] = useState(0);
  const [isRaining, setIsRaining] = useState(false);
  const [totalPastExams, setTotalPastExams] = useState(0);
  const [landingQuery, setLandingQuery] = useState("");

  const handleTitleClick = () => {
    if (titleClicks >= 9) {
      setIsRaining(true);
      setTimeout(() => {
        setIsRaining(false);
        setTitleClicks(0);
      }, 15000);
    } else {
      setTitleClicks(titleClicks + 1);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setSubjectsLoading(true);
    apiRequest
      .get<Stats>("/major/stats")
      .then((res) => {
        if (cancelled) return;
        if (Array.isArray(res.data.subjects)) {
          setSubjects(res.data.subjects);
          setTotalPastExams(res.data.totalPastExams);
        }
      })
      .catch(() => {
        if (cancelled) return;
      })
      .finally(() => {
        if (cancelled) return;
        setSubjectsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <>
      <div className="min-h-screen bg-animated-gradient sm:pt-15 pt-10 font-sans text-foreground selection:bg-primary/20">
        {/* --- Theme Toggle Button --- */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-40">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full w-9 h-9 sm:w-10 sm:h-10"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </Button>
        </div>

        {/* --- Hero Section --- */}
        <div className="text-center pt-8 sm:pt-12 pb-8 px-4">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 text-foreground">
            Bienvenue à{" "}
            <span className="text-primary" onClick={handleTitleClick}>
              l'ATACCothèque
            </span>
          </h1>
          <h3 className="text-2xl sm:text-1xl font-extrabold mb-2 tracking-tight leading-tight">
            Vos annales partout !
          </h3>
          <p className="text-base text-muted-foreground mb-6 max-w-2xl mx-auto">
            Votre plateforme dédiée au stockage et à la consultation des annales
            universitaires.
            <br className="hidden sm:inline" />
            La plateforme collaborative de l'ATACC. Annales et corrigés
            gratuits.
          </p>
        </div>

        {/* --- Barre de recherche --- */}
        <div className="w-full max-w-2xl mx-auto px-4 mb-8 relative ">
          <form
            className="relative group background bg-background/80 rounded-full"
            onSubmit={(event) => {
              event.preventDefault();
              const trimmedQuery = landingQuery.trim();
              navigate(
                trimmedQuery
                  ? `/search?q=${encodeURIComponent(trimmedQuery)}`
                  : "/search",
              );
            }}
          >
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-muted-foreground w-4 h-4" />
            </div>
            <Input
              type="text"
              value={landingQuery}
              onChange={(event) => setLandingQuery(event.target.value)}
              className="pl-10 py-6 text-sm w-full rounded-full"
              placeholder="Chercher par un cours, une matière, un niveau..."
            />
          </form>
        </div>

        {/* --- Grille des Matières --- */}
        <div className="max-w-4xl mx-auto px-4 mb-12 ">
          <h2 className="text-2xl font-bold mb-5 text-foreground">
            Parcourir par catégorie
          </h2>

          {/* Grille : 2 colonnes sur mobile, 3 sur tablette, 4+ sur PC */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {subjectsLoading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <Card
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    className="relative p-3 sm:p-4 rounded-xl border border-border/50 "
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-10" />
                    </div>
                  </Card>
                ))
              : subjects.map((subject) => {
                  const colors = getColorFromId(subject.name);
                  const IconComponent = getIconByName(subject.icon ?? "");
                  return (
                    <Card
                      key={subject.name}
                      className="group relative p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md border border-border/50 hover:border-primary/50 "
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        navigate(
                          `/search?major=${encodeURIComponent(subject.name)}`,
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(
                            `/search?major=${encodeURIComponent(subject.name)}`,
                          );
                        }
                      }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        {/* Icon container */}
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200 ${colors}`}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>

                        {/* Content */}
                        <h3 className="font-bold text-sm text-foreground text-center">
                          {subject.name}
                        </h3>
                        <p className="text-xs text-muted-foreground text-center">
                          {subject.pastExamCount}
                        </p>
                      </div>
                    </Card>
                  );
                })}
          </div>
        </div>

        {/* --- Notre Collection --- */}
        <div className="max-w-4xl mx-auto px-4 mb-12">
          <h2 className="text-2xl font-bold mb-5 text-foreground">
            Ce que nous proposons
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="p-4 border-border/50">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    Plus de{" "}
                    <span className="text-primary">
                      {totalPastExams < 10
                        ? totalPastExams
                        : 10 * Math.floor(totalPastExams / 10)}{" "}
                    </span>
                    annales
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-border/50">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    La possibilité de télécharger
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-border/50">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    Un outil de recherche avancé
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-border/50">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    Un espace d'ajout d'annale
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* --- Comment utiliser --- */}
        <div className="max-w-4xl mx-auto px-4 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            Comment utiliser l'ATACCothèque ?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-6 border-border/50 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <Search className="w-6 h-6" />
                </div>
              </div>
              <h3 className="font-bold text-foreground mb-2">1. Recherche</h3>
              <p className="text-sm text-muted-foreground">
                Utilisez notre moteur de recherche pour trouver les documents
                par thème, auteur ou mot-clé
              </p>
            </Card>
            <Card className="p-6 border-border/50 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <Eye className="w-6 h-6" />
                </div>
              </div>
              <h3 className="font-bold text-foreground mb-2">
                2. Consultation
              </h3>
              <p className="text-sm text-muted-foreground">
                Accédez aux résumés et aux informations détaillées sur chaque
                document
              </p>
            </Card>
            <Card className="p-6 border-border/50 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
              <h3 className="font-bold text-foreground mb-2">3. Ressources</h3>
              <p className="text-sm text-muted-foreground">
                Découvrez les liens vers les versions numériques quand elles
                sont disponibles
              </p>
            </Card>
          </div>
        </div>

        {/* --- Catalogue CTA --- */}
        <div className="max-w-4xl mx-auto px-4 mb-12">
          <div className="bg-linear-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6 sm:p-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-foreground">
              Contribuer au Catalogue
            </h2>
            <p className="text-muted-foreground mb-6">
              Avez-vous des annales à partager avec la communauté ?
            </p>
            <RouterLink to="/upload">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Ajouter une annale
              </Button>
            </RouterLink>
          </div>
        </div>

        {/* --- Suivez-nous --- */}
        <div className="max-w-4xl mx-auto px-4 pb-33">
          <h2 className="text-2xl font-bold mb-6 text-center text-foreground">
            Suivez-nous
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://www.instagram.com/instatacc/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2">
                <Instagram className="w-4 h-4" />
                Instagram
              </Button>
            </a>
            <a
              href="https://universitice.univ-rouen.fr/course/view.php?id=10545"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Universitice
              </Button>
            </a>
          </div>
        </div>
      </div>
      {isRaining && (
        <>
          <div className="pointer-events-none fixed inset-0 z-100 overflow-hidden">
            {Array.from({ length: 60 }).map((_, i) => {
              const left = Math.random() * 100;
              const delay = Math.random() * 5;
              const duration = 2 + Math.random() * 7;
              const size = 20 + Math.random() * 50;

              return (
                <img
                  key={i}
                  src="/atacc_logo.png"
                  className="absolute top-[-10%] animate-logo-rain"
                  style={{
                    left: `${left}%`,
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                    width: `${size + 20}px`,
                    height: `${size}px`,
                  }}
                  alt=""
                  aria-hidden="true"
                />
              );
            })}
          </div>

          <div className="pointer-events-none fixed inset-0 z-101 flex items-center justify-center">
            <img
              src="/atacc_logo.png"
              alt="Gros Logo ATACC Dansant"
              className="w-88 h-88 md:w-64 md:h-64 object-contain animate-logo-dance-bounce drop-shadow-lg"
              aria-hidden="true"
            />
          </div>
        </>
      )}
    </>
  );
}
