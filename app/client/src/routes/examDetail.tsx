import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useState, useEffect, useRef } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Edit, BookOpen, Calendar, ArrowLeft, Download, ChevronLeft, ChevronRight, Paperclip, Link as LinkIcon, FileText } from "lucide-react";
import { API_ENDPOINT } from '@/config/env';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/config/permissions';

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
  GlobalWorkerOptions: { workerSrc: string; };
  getDocument(url: string): PDFGetDocumentResponse;
}
declare global {
  interface Window { pdfjsLib: PDFJsLib; }
}


// --- Data Interfaces ---
interface Annexe {
  id: number;
  name: string;
  type: string; // "FILE" or "URL"
  url: string | null;
}

interface ExamDetail {
  id: string;
  course: string;
  type?: string;
  level: string;
  major: string;
  year: number;
  path: string;
  title?: string;
  annexes: Annexe[]; // Added Annexes
}

export function ExamDetail() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [exam, setExam] = useState<ExamDetail | null>(
    (location.state?.exam as ExamDetail) || null
  );
  const [isLoading, setIsLoading] = useState(!exam);
  const [error, setError] = useState<string | null>(null);
  const { perms } = useAuth();
  const canManageAnnales = perms.includes(PERMISSIONS.MANAGE_ANNALES);

  // PDF.js State
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfReady, setPdfReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<PDFDocument | null>(null);
  const renderTaskRef = useRef<PDFRenderTask | null>(null);

  // 1. Fetch Deep Data from PostgreSQL
  const fetchExam = useCallback(async () => {
    if (!examId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_ENDPOINT}/pastExam/public/${examId}`);

      if (!response.ok) {
        if (response.status === 404) throw new Error('Examen introuvable ou non vérifié.');
        throw new Error('Erreur lors de la récupération des données.');
      }

      const dbExam = await response.json();

      const mappedExam: ExamDetail = {
        id: dbExam.id.toString(),
        course: dbExam.course?.name || 'Inconnu',
        type: dbExam.examtype?.name || 'Inconnu',
        level: dbExam.course?.level?.name || 'Inconnu',
        major: dbExam.course?.parcours?.[0]?.majors?.[0]?.name || 'Non défini',
        year: dbExam.year,
        path: dbExam.path,
        annexes: dbExam.annexe || [], // Load annexes
      };

      setExam(mappedExam);
    } catch (err: any) {
      console.error('Failed to fetch exam', err);
      setError(err.message || 'Impossible de charger les détails de l\'examen.');
    } finally {
      setIsLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    if (!exam) fetchExam();
  }, [exam, fetchExam]);

  // 2. Initialize PDF.js
  useEffect(() => {
    if (!exam) return;

    const initializePdf = async () => {
      try {
        setPdfLoading(true);
        let pdfjsLib = window.pdfjsLib;
        let attempts = 0;

        while (!pdfjsLib && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          pdfjsLib = window.pdfjsLib;
          attempts++;
        }

        if (!pdfjsLib) throw new Error('PDF.js library failed to load');

        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const pdfUrl = `${API_ENDPOINT}/pastExam/public/${exam.id}/file`;
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;

        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setPageNumber(1);
        setPdfReady(true);
        setPdfLoading(false);
      } catch (err) {
        console.error('PDF init error:', err);
        setError(`Failed to load PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setPdfLoading(false);
      }
    };

    initializePdf();
  }, [exam]);

  // 3. Render PDF Page
  useEffect(() => {
    if (!pdfReady || !pdfDocRef.current || !canvasRef.current) return;

    const renderCurrentPage = async () => {
      try {
        setPdfLoading(true);
        const pdf = pdfDocRef.current;
        const canvas = canvasRef.current;

        if (!pdf || !canvas) {
          setPdfLoading(false);
          return;
        }

        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }

        const page = await pdf.getPage(pageNumber);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not get canvas context');

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        context.save();
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.restore();

        const renderContext = { canvasContext: context, viewport: viewport };
        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        renderTaskRef.current = null;
        setPdfLoading(false);

      } catch (err: any) {
        if (err.name === 'RenderingCancelledException') return;
        console.error('PDF rendering error:', err);
        setError(`Failed to render page.`);
        setPdfLoading(false);
      }
    };

    renderCurrentPage();

    return () => {
      if (renderTaskRef.current) renderTaskRef.current.cancel();
    };
  }, [pageNumber, pdfReady]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="h-12 w-12 text-primary" />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="p-10 space-y-6 max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/search')}
          className="flex items-center gap-2 text-primary hover:text-primary/80 hover:bg-primary/10 px-3 py-2 rounded-lg transition-all mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la recherche
        </button>
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-6 max-w-full mx-auto">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/search')}
          className="flex items-center gap-2 text-primary hover:text-primary/80 hover:bg-primary/10 px-3 py-2 rounded-lg transition-all cursor-pointer w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la recherche
        </button>

        {/* Edit Button (Conditionally Rendered) */}
        {canManageAnnales && (
          <button
            onClick={() => navigate(`/admin/manageExam?id=${exam.id}`)}
            className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600 px-4 py-2 rounded-lg transition-all cursor-pointer shadow-sm"
          >
            <Edit className="h-4 w-4" />
            Modifier l'annale
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Details & Annexes */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-l-4 border-l-primary h-fit shadow-md">
            <CardHeader className="pb-6">
              <div className="space-y-4">
                <div>
                  <CardTitle className="text-2xl font-bold text-primary mb-2">
                    {exam.course}
                  </CardTitle>
                  {exam.title && (
                    <p className="text-sm text-muted-foreground">{exam.title}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {exam.type && <Badge variant="default">{exam.type}</Badge>}
                  <Badge variant="secondary" className="gap-1">
                    <BookOpen className="h-3 w-3" />
                    {exam.major}
                  </Badge>
                  <Badge variant="outline">{exam.level}</Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground ml-1">
                    <Calendar className="h-4 w-4" />
                    {exam.year}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Leaky File Path Block REMOVED! */}

              <div className="space-y-3">
                <a
                  href={`${API_ENDPOINT}/pastExam/public/${exam.id}/file`}
                  download
                  className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium w-full justify-center shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  Télécharger le Sujet
                </a>
              </div>

              {/* NEW: Annexes Section */}
              {exam.annexes && exam.annexes.length > 0 && (
                <div className="pt-6 border-t space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
                    <Paperclip className="h-4 w-4" /> Annexes & Ressources
                  </h3>
                  <div className="flex flex-col gap-2">
                    {exam.annexes.map((annexe) => {
                      // Note: Assumes your colleague's /adminAnnexe route can be public, 
                      // or replace with your public annexe route if you made one!
                      const annexeHref = annexe.type === 'URL'
                        ? annexe.url
                        : `${API_ENDPOINT}/pastExam/adminAnnexe/${annexe.id}`;

                      return (
                        <a
                          key={annexe.id}
                          href={annexeHref || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-3 py-2.5 bg-secondary/40 hover:bg-secondary rounded-md text-sm transition-colors group"
                        >
                          {annexe.type === 'URL' ? (
                            <LinkIcon className="h-4 w-4 text-blue-500 group-hover:text-blue-600" />
                          ) : (
                            <FileText className="h-4 w-4 text-orange-500 group-hover:text-orange-600" />
                          )}
                          <span className="font-medium truncate flex-1">{annexe.name}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: PDF Viewer */}
        <div className="lg:col-span-2 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Aperçu du document</p>
          <div className="w-full bg-muted rounded-xl border border-input overflow-hidden flex flex-col shadow-inner">

            {/* PDF Canvas */}
            <div className="relative flex-1 overflow-auto flex items-center justify-center bg-gray-900 p-2 min-h-100 lg:min-h-175">
              {pdfLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900/50">
                  <Spinner className="h-8 w-8 text-primary" />
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="shadow-2xl max-w-full block"
              />
            </div>

            {/* Page Navigation */}
            {numPages && numPages > 1 && (
              <div className="flex items-center justify-center gap-4 p-4 border-t bg-background">
                <button
                  onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                  disabled={pageNumber <= 1}
                  className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm font-medium text-muted-foreground">
                  Page {pageNumber} sur {numPages}
                </span>
                <button
                  onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                  disabled={pageNumber >= numPages}
                  className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
