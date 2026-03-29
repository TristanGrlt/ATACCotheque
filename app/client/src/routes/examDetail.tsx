import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  Edit,
  BookOpen,
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

// --- PDF.js Interfaces ---
interface PDFViewport {
  width: number;
  height: number;
  scale: number;
}
interface PDFRenderContext {
  canvasContext: CanvasRenderingContext2D;
  viewport: PDFViewport;
}
interface PDFRenderTask {
  promise: Promise<void>;
  cancel: () => void;
}
interface PDFPage {
  getViewport(options: { scale: number }): PDFViewport;
  render(renderContext: PDFRenderContext): PDFRenderTask;
}
interface PDFDocument {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPage>;
}
interface PDFGetDocumentResponse {
  promise: Promise<PDFDocument>;
}
interface PDFJsLib {
  version: string;
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(url: string): PDFGetDocumentResponse;
}
declare global {
  interface Window {
    pdfjsLib: PDFJsLib;
  }
}

// --- Data Interfaces ---
interface Annexe {
  id: number;
  name: string;
  type: string;
  url: string | null;
}
interface ExamDetail {
  id: string;
  course: string;
  type?: string;
  level: string;
  majors: string[]; // NOUVEAU : Tableau pour stocker toutes les majors
  majorIcon: string;
  year: number;
  title?: string;
  annexes: Annexe[];
}

// --- Composant d'affichage de page (Lazy Loading) ---
const PdfPageRenderer = ({
  pdf,
  pageNumber,
}: {
  pdf: PDFDocument;
  pageNumber: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "800px 0px" },
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView || isRendered || !pdf || !canvasRef.current) return;

    let renderTask: PDFRenderTask;
    const renderPage = async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
        setIsRendered(true);
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error(`Erreur rendu page ${pageNumber}:`, err);
        }
      }
    };

    renderPage();
    return () => {
      if (renderTask) renderTask.cancel();
    };
  }, [isInView, isRendered, pdf, pageNumber]);

  return (
    <div
      ref={containerRef}
      className="w-full flex justify-center mb-6 relative"
      style={{
        minHeight: !isRendered ? "800px" : "auto",
        aspectRatio: !isRendered ? "1/1.414" : "auto",
      }}
    >
      {!isRendered && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 rounded-lg animate-pulse">
          <Spinner className="h-8 w-8 text-primary/50" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`shadow-lg max-w-full block rounded-lg bg-white transition-opacity duration-500 ${isRendered ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
};

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

  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const pdfDocRef = useRef<PDFDocument | null>(null);

  const fetchExam = useCallback(async () => {
    if (!examId) return;
    try {
      setIsLoading(true);
      const response = await fetch(`${API_ENDPOINT}/pastExam/public/${examId}`);
      if (!response.ok)
        throw new Error("Examen introuvable ou erreur de récupération.");

      const dbExam = await response.json();

      // Extraction de toutes les majors
      const majorsList = dbExam.course?.parcours?.[0]?.majors || [];
      const majorNames = majorsList.map((m: any) => m.name);
      const firstMajorIcon = majorsList[0]?.icon || "";

      setExam({
        id: dbExam.id.toString(),
        course: dbExam.course?.name || "Inconnu",
        type: dbExam.examtype?.name || "Inconnu",
        level: dbExam.course?.level?.name || "Inconnu",
        majors: majorNames.length > 0 ? majorNames : ["Non défini"], // NOUVEAU
        majorIcon: firstMajorIcon,
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

  useEffect(() => {
    if (!exam) return;
    const initializePdf = async () => {
      try {
        setPdfLoading(true);
        let pdfjsLib = window.pdfjsLib;
        let attempts = 0;
        while (!pdfjsLib && attempts < 10) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          pdfjsLib = window.pdfjsLib;
          attempts++;
        }
        if (!pdfjsLib) throw new Error("Librairie PDF.js non chargée");

        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        const pdfUrl = `${API_ENDPOINT}/pastExam/public/${exam.id}/file`;
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;

        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setPdfLoading(false);
      } catch (err) {
        console.error("PDF init error:", err);
        setError(`Erreur de chargement du PDF.`);
        setPdfLoading(false);
      }
    };
    initializePdf();
  }, [exam]);

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
            onClick={() => navigate("/search")}
            variant="ghost"
            className="gap-2 -ml-2 mb-4 hover:bg-background/50"
          >
            <ArrowLeft className="h-4 w-4" /> Retour à la recherche
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

  const CourseIcon =
    (exam.majorIcon && getIconByName(exam.majorIcon)) || BookOpen;

  return (
    <div className="min-h-screen bg-animated-gradient sm:pt-15 pt-10 pb-12 font-sans text-foreground selection:bg-primary/20 flex flex-col items-center px-4">
      <div className="w-full max-w-[1200px] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button
            onClick={() => navigate("/search")}
            variant="ghost"
            className="gap-2 -ml-2 w-fit hover:bg-background/50 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" /> Retour à la recherche
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
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <Card className="p-5 sm:p-6 rounded-xl border border-border/50 bg-background/80 backdrop-blur-sm shadow-sm">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <CourseIcon className="w-6 h-6" />
                </div>
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

                {/* NOUVEAU : Affichage de toutes les majors sous forme de badges */}
                {/* Affichage sécurisé des majors (gère les objets et les chaînes de caractères) */}
                {(exam.majors || []).map((majorItem: any, index: number) => {
                  // Si c'est un objet (ex: {name: "Infor"}), on extrait le nom. Sinon on garde la chaîne.
                  const displayName =
                    typeof majorItem === "object" ? majorItem.name : majorItem;

                  // On ne rend rien si le nom est vide
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

                {/* Fallback de sécurité si l'ancienne propriété 'major' est présente mais pas 'majors' */}
                {!exam.majors && exam.majors && (
                  <Badge
                    variant="secondary"
                    className="gap-1 text-xs bg-secondary/50"
                  >
                    {typeof exam.majors === "object"
                      ? (exam.majors as any).name
                      : exam.majors}
                  </Badge>
                )}

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
                <a
                  href={`${API_ENDPOINT}/pastExam/public/${exam.id}/file`}
                  download
                >
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

              <div className="flex-1 overflow-y-auto custom-scrollbar rounded-lg bg-slate-950 p-4 sm:p-8">
                {pdfLoading && (
                  <div className="h-full w-full flex items-center justify-center">
                    <Spinner className="h-8 w-8 text-primary" />
                  </div>
                )}

                {!pdfLoading && pdfDocRef.current && numPages && (
                  <div className="flex flex-col mx-auto max-w-4xl">
                    {Array.from({ length: numPages }, (_, i) => i + 1).map(
                      (page) => (
                        <PdfPageRenderer
                          key={`page-${page}`}
                          pdf={pdfDocRef.current!}
                          pageNumber={page}
                        />
                      ),
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
