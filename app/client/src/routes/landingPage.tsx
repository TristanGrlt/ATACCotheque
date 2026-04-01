import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
// Importer les fonctions depuis le fichier de configuration
import { getIconByName, getColorFromId } from "../config/icons";

type Stats = {
  subjects: Subject[];
  totalPastExams: number;
};

type Subject = {
  name: string;
  icon: string | null;
  pastExamCount: number;
};

const sectionMotion = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
  viewport: { once: true, amount: 0.15 },
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

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

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
    setTheme(isDarkMode ? "light" : "dark");
  };

  return (
    <>
      <motion.div
        className="min-h-screen bg-animated-gradient sm:pt-15 pt-10 font-sans text-foreground selection:bg-primary/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        {/* --- Theme Toggle Button --- */}
        <motion.div
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-40"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 0.15,
            type: "spring",
            stiffness: 220,
            damping: 16,
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full w-9 h-9 sm:w-10 sm:h-10"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </Button>
        </motion.div>

        {/* --- Hero Section --- */}
        <motion.div
          className="text-center pt-8 sm:pt-12 pb-8 px-4"
          {...sectionMotion}
        >
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
        </motion.div>

        {/* --- Barre de recherche --- */}
        <motion.div
          className="w-full max-w-2xl mx-auto px-4 mb-8 relative"
          {...sectionMotion}
        >
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
        </motion.div>

        {/* --- Grille des Matières --- */}
        <motion.div className="max-w-4xl mx-auto px-4 mb-12" {...sectionMotion}>
          <h2 className="text-2xl font-bold mb-5 text-foreground">
            Parcourir par catégorie
          </h2>

          {/* Grille : 2 colonnes sur mobile, 3 sur tablette, 4+ sur PC */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {subjectsLoading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <motion.div
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * index, duration: 0.3 }}
                  >
                    <Card className="relative p-3 sm:p-4 rounded-xl border border-border/50 ">
                      <div className="flex flex-col items-center gap-2">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-10" />
                      </div>
                    </Card>
                  </motion.div>
                ))
              : subjects.map((subject, index) => {
                  const colors = getColorFromId(subject.name);
                  const IconComponent = getIconByName(subject.icon ?? "");
                  return (
                    <motion.div
                      key={subject.name}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index, duration: 0.35 }}
                      viewport={{ once: true, amount: 0.2 }}
                      whileHover={{ translateY: -3, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Card
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
                    </motion.div>
                  );
                })}
          </div>
        </motion.div>

        {/* --- Notre Collection --- */}
        <motion.div className="max-w-4xl mx-auto px-4 mb-12" {...sectionMotion}>
          <h2 className="text-2xl font-bold mb-5 text-foreground">
            Ce que nous proposons
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "Plus de annales",
              "La possibilité de télécharger",
              "Un outil de recherche avancé",
              "Un espace d'ajout d'annale",
            ].map((text, index) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index, duration: 0.35 }}
                viewport={{ once: true, amount: 0.2 }}
                whileHover={{ translateY: -2 }}
              >
                <Card className="p-4 border-border/50">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">
                        {text === "Plus de annales" ? (
                          <>
                            Plus de{" "}
                            <span className="text-primary">
                              {totalPastExams < 10
                                ? totalPastExams
                                : 10 * Math.floor(totalPastExams / 10)}{" "}
                            </span>
                            annales
                          </>
                        ) : (
                          text
                        )}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* --- Comment utiliser --- */}
        <motion.div className="max-w-4xl mx-auto px-4 mb-12" {...sectionMotion}>
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            Comment utiliser l'ATACCothèque ?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                title: "1. Recherche",
                icon: <Search className="w-6 h-6" />,
                text: "Utilisez notre moteur de recherche pour trouver les documents par thème, auteur ou mot-clé",
              },
              {
                title: "2. Consultation",
                icon: <Eye className="w-6 h-6" />,
                text: "Accédez aux résumés et aux informations détaillées sur chaque document",
              },
              {
                title: "3. Ressources",
                icon: <FileText className="w-6 h-6" />,
                text: "Découvrez les liens vers les versions numériques quand elles sont disponibles",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * index, duration: 0.35 }}
                viewport={{ once: true, amount: 0.2 }}
                whileHover={{ translateY: -3 }}
              >
                <Card className="p-6 border-border/50 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      {item.icon}
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* --- Catalogue CTA --- */}
        <motion.div className="max-w-4xl mx-auto px-4 mb-12" {...sectionMotion}>
          <motion.div
            className="bg-linear-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6 sm:p-8 text-center"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
          >
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
          </motion.div>
        </motion.div>

        {/* --- Suivez-nous --- */}
        <motion.div className="max-w-4xl mx-auto px-4 pb-33" {...sectionMotion}>
          <h2 className="text-2xl font-bold mb-6 text-center text-foreground">
            Suivez-nous
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              {
                label: "Instagram",
                href: "https://www.instagram.com/instatacc/",
                icon: <Instagram className="w-4 h-4" />,
              },
              {
                label: "Universitice",
                href: "https://universitice.univ-rouen.fr/course/view.php?id=10545",
                icon: <ExternalLink className="w-4 h-4" />,
              },
            ].map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ translateY: -2 }}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index, duration: 0.3 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <Button variant="outline" className="gap-2">
                  {item.icon}
                  {item.label}
                </Button>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </motion.div>
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
