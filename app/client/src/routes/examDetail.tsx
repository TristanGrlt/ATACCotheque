import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Calendar,
  ArrowLeft,
  Download,
  Paperclip,
  Link as LinkIcon,
  FileText,
  AlertCircle,
} from "lucide-react";
import { API_ENDPOINT } from "@/config/env";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/config/permissions";
import { getIconByName } from "@/config/icons";

// --- Import react-pdf ---
import { Document, Page, pdfjs } from "react-pdf";
// Import des styles obligatoires pour react-pdf
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configuration automatique du Web Worker (indispensable pour les performances)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const STACK_ICON_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700",
  "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-100 dark:border-emerald-700",
  "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900 dark:text-amber-100 dark:border-amber-700",
  "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900 dark:text-violet-100 dark:border-violet-700",
  "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900 dark:text-rose-100 dark:border-rose-700",
  "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900 dark:text-cyan-100 dark:border-cyan-700",
];

function getStackIconColor(key: string): string {
  if (!key) return STACK_ICON_COLORS[0];
  const hash = key.split("").reduce((acc, char) => {
    const hashVal = (acc << 5) - acc + char.charCodeAt(0);
    return hashVal | 0;
  }, 0);
  return STACK_ICON_COLORS[Math.abs(hash) % STACK_ICON_COLORS.length];
}

// --- Data Interfaces ---
interface Annexe {
  id: number;
  name: string;
  type: string;
  url: string | null;
}
interface MajorEntry {
  name: string;
  icon?: string | null;
}
interface ExamDetail {
  id: string;
  course: string;
  type?: string;
  level: string;
  majors?: MajorEntry[];
  majorIcon?: string;
  year: number;
  title?: string;
  annexes: Annexe[];
}

// --- Composant Principal ---
export function ExamDetail() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [exam, setExam] = useState<ExamDetail | null>(
    (location.state?.exam as ExamDetail) || null,
  );
  const [isLoading, setIsLoading] = useState(!exam);
  const [error, setError] = useState<string | null>(null);

  const { perms } = useAuth();
  const canManageAnnales = perms.includes(PERMISSIONS.MANAGE_EXAMS);

  // States pour react-pdf
  const [numPages, setNumPages] = useState<number>();
  const [containerWidth, setContainerWidth] = useState<number>(800);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // Ajustement dynamique de la largeur du PDF en fonction du conteneur
  const pdfContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setContainerWidth(node.getBoundingClientRect().width);
    }
  }, []);

  const fetchExam = useCallback(async () => {
    if (!examId) return;
    try {
      setIsLoading(true);
      const response = await fetch(`${API_ENDPOINT}/pastExam/public/${examId}`);
      if (!response.ok)
        throw new Error("Examen introuvable ou erreur de récupération.");

      const dbExam = await response.json();

      const allMajorsRaw: MajorEntry[] = (dbExam.course?.parcours || [])
        .flatMap((p: any) => p.majors || [])
        .map((m: any) => ({ name: m.name, icon: m.icon ?? null }));

      const majorsMap = new Map<string, MajorEntry>();
      allMajorsRaw.forEach((m) => {
        if (!majorsMap.has(m.name)) majorsMap.set(m.name, m);
      });
      const majorsList = Array.from(majorsMap.values());
      const firstMajorIcon = majorsList[0]?.icon || "";

      setExam({
        id: dbExam.id.toString(),
        course: dbExam.course?.name || "Inconnu",
        type: dbExam.examtype?.name || "Inconnu",
        level: dbExam.course?.level?.name || "Inconnu",
        majors:
          majorsList.length > 0
            ? majorsList
            : [{ name: "Non défini", icon: "FileText" }],
        majorIcon: firstMajorIcon || undefined,
        year: dbExam.year,
        annexes: dbExam.annexe || [],
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchExam();
  }, [fetchExam]);

  if (isLoading)
    return (
      <div className="min-h-screen bg-animated-gradient flex items-center justify-center font-sans">
        <Spinner className="h-12 w-12 text-primary" />
      </div>
    );

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-animated-gradient sm:pt-15 pt-10 font-sans flex flex-col items-center px-4">
        <div className="w-full max-w-2xl space-y-6">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="gap-2 -ml-2 mb-4 hover:bg-background/50"
          >
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
          <Alert
            variant="destructive"
            className="border-destructive/50 bg-destructive/10"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const majorEntries = (exam.majors || []).map((m) =>
    typeof m === "string" ? { name: m, icon: m } : m,
  );
  const iconsToRender = (
    majorEntries.length > 0
      ? majorEntries
      : [{ name: "default", icon: "FileText" }]
  ).slice(0, 3);
  const remainingIcons = Math.max(
    0,
    majorEntries.length - iconsToRender.length,
  );

  // URL directe vers le fichier PDF
  const pdfFileUrl = `${API_ENDPOINT}/pastExam/public/${exam.id}/file`;

  return (
    <div className="min-h-screen bg-animated-gradient sm:pt-15 pt-10 pb-12 font-sans text-foreground selection:bg-primary/20 flex flex-col items-center px-4">
      <div className="w-full max-w-300 space-y-6">
        {/* EN-TÊTE BOUTONS */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="gap-2 -ml-2 w-fit hover:bg-background/50 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
          {canManageAnnales && (
            <Button
              onClick={() => navigate(`/admin/manageExam?id=${exam.id}`)}
              className="gap-2 w-full sm:w-fit rounded-full"
            >
              <Edit className="h-4 w-4" /> Modifier l'annale
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
          {/* COLONNE GAUCHE : INFOS DE L'EXAMEN */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <Card className="p-5 sm:p-6 rounded-xl border border-border/50 bg-background/80 backdrop-blur-sm shadow-sm">
              <div className="flex items-start gap-4 mb-5">
                <motion.div
                  className="relative w-14 h-12 shrink-0 group/icon"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {iconsToRender.map((major, iconIndex) => {
                    const iconKey = major.icon || major.name || "default";
                    const IconComponent = getIconByName(iconKey);
                    const iconColors = getStackIconColor(iconKey);

                    return (
                      <motion.div
                        key={`${exam.id}-${iconKey}-${iconIndex}`}
                        className={`absolute w-10 h-10 rounded-lg flex items-center justify-center border shadow-md ring-1 ring-background transition-all duration-150 ease-out ${iconColors} ${
                          iconIndex === 0
                            ? "z-30"
                            : iconIndex === 1
                              ? "z-20 group-hover/icon:translate-x-3 group-hover/icon:-translate-y-1"
                              : "z-10 group-hover/icon:translate-x-6 group-hover/icon:-translate-y-2"
                        }`}
                        style={{
                          left: `${iconIndex * 8}px`,
                          top: `${iconIndex * 2}px`,
                        }}
                        whileHover={{ y: -2 }}
                        transition={{
                          type: "spring",
                          stiffness: 260,
                          damping: 18,
                        }}
                      >
                        <IconComponent className="w-5 h-5" />
                      </motion.div>
                    );
                  })}
                  {remainingIcons > 0 && (
                    <div className="absolute -right-1 -bottom-1 z-40 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center border border-background">
                      +{remainingIcons}
                    </div>
                  )}
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                    {exam.course}
                  </h1>
                  {exam.title && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {exam.title}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {exam.type && (
                  <Badge
                    variant="default"
                    className="text-xs bg-primary hover:bg-primary/90"
                  >
                    {exam.type}
                  </Badge>
                )}
                {(exam.majors || []).map((majorItem: any, index: number) => {
                  const displayName =
                    typeof majorItem === "object" ? majorItem.name : majorItem;
                  if (!displayName) return null;
                  return (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="gap-1 text-xs bg-secondary/50"
                    >
                      {displayName}
                    </Badge>
                  );
                })}
                <Badge variant="outline" className="text-xs border-border/50">
                  {exam.level}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Calendar className="h-4 w-4 shrink-0" />
                <span className="font-medium">Année {exam.year}</span>
              </div>

              <Button
                asChild
                size="lg"
                className="w-full gap-2 rounded-xl shadow-sm mb-6"
              >
                <a href={pdfFileUrl} download>
                  <Download className="h-4 w-4" /> Télécharger le Sujet
                </a>
              </Button>

              {exam.annexes && exam.annexes.length > 0 && (
                <div className="pt-6 border-t border-border/50 space-y-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-primary" /> Annexes (
                    {exam.annexes.length})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {exam.annexes.map((annexe) => {
                      const isUrlAnnexe = annexe.type === "URL";
                      const annexeHref = isUrlAnnexe
                        ? annexe.url
                        : annexe.id
                          ? `${API_ENDPOINT}/pastExam/public/annexe/${annexe.id}`
                          : null;
                      const isDisabled = !annexeHref;

                      return (
                        <a
                          key={annexe.id}
                          href={annexeHref || "#"}
                          target={isDisabled ? undefined : "_blank"}
                          rel={isDisabled ? undefined : "noopener noreferrer"}
                          onClick={(event) => {
                            if (isDisabled) event.preventDefault();
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl border border-border/50 transition-all group ${isDisabled ? "bg-secondary/10 text-muted-foreground cursor-not-allowed" : "bg-background/50 hover:bg-background/80 hover:border-primary/50 text-foreground hover:shadow-sm"}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isDisabled ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary group-hover:bg-primary/20"}`}
                          >
                            {isUrlAnnexe ? (
                              <LinkIcon className="h-4 w-4" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                          </div>
                          <span className="font-medium text-sm truncate flex-1">
                            {annexe.name}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* COLONNE DROITE : AFFICHAGE DU PDF AVEC REACT-PDF */}
          <div className="lg:col-span-8">
            <Card className="rounded-xl border border-border/50 p-2 sm:p-4 bg-slate-900/90 backdrop-blur-sm shadow-sm h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-3 px-2">
                <h2 className="text-sm font-bold text-slate-200">
                  Aperçu du document
                </h2>
                {numPages && (
                  <span className="text-xs font-medium text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                    {numPages} pages
                  </span>
                )}
              </div>

              <div
                className="flex-1 overflow-y-auto custom-scrollbar rounded-lg bg-slate-950 p-4 sm:p-8"
                ref={pdfContainerRef}
              >
                <Document
                  file={pdfFileUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={
                    <div className="flex items-center justify-center h-full w-full py-20">
                      <Spinner className="h-8 w-8 text-primary" />
                    </div>
                  }
                  error={
                    <div className="text-center text-destructive py-10">
                      Impossible de charger le PDF.
                    </div>
                  }
                  className="flex flex-col items-center"
                >
                  {Array.from(new Array(numPages), (_, index) => (
                    <div
                      key={`page_${index + 1}`}
                      className="mb-6 shadow-xl rounded-lg overflow-hidden bg-white"
                    >
                      <Page
                        pageNumber={index + 1}
                        width={
                          containerWidth
                            ? Math.min(containerWidth - 32, 800)
                            : 800
                        } // Gère le padding et max-width
                        renderTextLayer={false} // Désactivé pour de meilleures performances (mets true si tu veux que le texte soit sélectionnable)
                        renderAnnotationLayer={false} // Idem
                        loading={
                          <div className="h-200 flex items-center justify-center bg-slate-800/50 animate-pulse">
                            <Spinner className="h-8 w-8 text-primary/50" />
                          </div>
                        }
                      />
                    </div>
                  ))}
                </Document>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
