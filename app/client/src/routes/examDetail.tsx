import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useState, useEffect, useRef } from 'react';
import { MeiliSearch } from 'meilisearch';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { BookOpen, Calendar, Archive, ArrowLeft, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { MEILI_HOST, MEILI_API_KEY, API_ENDPOINT } from '@/config/env';

// PDF.js type definitions
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
  GlobalWorkerOptions: {
    workerSrc: string;
  };
  getDocument(url: string): PDFGetDocumentResponse;
}

// Declare PDF.js on window
declare global {
  interface Window {
    pdfjsLib: PDFJsLib;
  }
}

const client = new MeiliSearch({
  host: MEILI_HOST,
  apiKey: MEILI_API_KEY
});

interface ExamDetail {
  id: string;
  course: string;
  type?: string;
  level: string;
  major: string;
  year: number;
  path: string;
  title?: string;
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
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfReady, setPdfReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<PDFDocument | null>(null);
  const renderTaskRef = useRef<PDFRenderTask | null>(null);

  const fetchExam = useCallback(async () => {
    if (!examId) return;

    try {
      setIsLoading(true);
      setError(null);

      const search = await client.index('exams').search('', {
        limit: 1000
      });

      const found = search.hits.find((hit) =>
        (hit as unknown as ExamDetail).id === examId
      );

      if (!found) {
        setError('Examen non trouvé');
        return;
      }

      setExam(found as ExamDetail);
    } catch (err) {
      console.error('Failed to fetch exam', err);
      setError('Impossible de charger les détails de l\'examen. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    if (!exam) {
      fetchExam();
    }
  }, [exam, fetchExam]);

  // Initialize PDF.js and load document
  useEffect(() => {
    if (!exam) return;

    const initializePdf = async () => {
      try {
        setPdfLoading(true);

        // Wait for PDF.js library to load
        let pdfjsLib = window.pdfjsLib;
        let attempts = 0;

        while (!pdfjsLib && attempts < 10) {
          console.log('Waiting for PDF.js library...');
          await new Promise(resolve => setTimeout(resolve, 100));
          pdfjsLib = window.pdfjsLib;
          attempts++;
        }

        if (!pdfjsLib) {
          throw new Error('PDF.js library failed to load');
        }

        console.log('PDF.js library loaded, version:', pdfjsLib.version);

        // Set worker source for PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        // Load PDF from backend
        const pdfUrl = `${API_ENDPOINT}/pastExam/public/${examId}/file`;
        console.log('Loading PDF from:', pdfUrl);

        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        console.log('PDF loaded successfully, total pages:', pdf.numPages);

        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setPageNumber(1);
        setPdfReady(true);
        setPdfLoading(false);
      } catch (err) {
        console.error('PDF initialization error:', err);
        setError(`Failed to load PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setPdfLoading(false);
      }
    };

    initializePdf();
  }, [exam]);

  // Render current page whenever page number changes
  // Render current page whenever page number changes
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

        // 1. If a render is already in progress, cancel it!
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

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        // 2. Start the new render task and save it to our ref
        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        // 3. Wait for the render to finish
        await renderTask.promise;

        // 4. Clear the ref once successful
        renderTaskRef.current = null;
        setPdfLoading(false);

      } catch (err: any) {
        // 5. IMPORTANT: Ignore the error if it was caused by our intentional cancellation
        if (err.name === 'RenderingCancelledException') {
          console.log('Previous render cancelled safely.');
          return;
        }

        console.error('PDF rendering error:', err);
        setError(`Failed to render page: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setPdfLoading(false);
      }
    };

    renderCurrentPage();

    // Cleanup function: cancel any ongoing render if the component unmounts
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
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
          <AlertDescription>
            {error || 'Une erreur est survenue lors du chargement de l\'examen'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-6 max-w-full mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/search')}
        className="flex items-center gap-2 text-primary hover:text-primary/80 hover:bg-primary/10 px-3 py-2 rounded-lg transition-all cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la recherche
      </button>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Details */}
        <Card className="border-l-4 border-l-primary h-fit">
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

              {/* Metadata Badges */}
              <div className="flex flex-wrap gap-2">
                {exam.type && (
                  <Badge variant="default">
                    {exam.type}
                  </Badge>
                )}
                <Badge variant="secondary" className="gap-1">
                  <BookOpen className="h-3 w-3" />
                  {exam.major}
                </Badge>
                <Badge variant="outline">{exam.level}</Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {exam.year}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* File Path */}
            <div className="space-y-2 p-4 bg-accent rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Archive className="h-4 w-4" />
                Fichier
              </div>
              <p className="text-sm text-muted-foreground font-mono break-all">{exam.path}</p>
            </div>

            {/* Download Section */}
            <div className="space-y-3">
              <a
                href={`${API_ENDPOINT}/pastExam/public/${exam.id}/file`}
                download
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium w-full justify-center"
              >
                <Download className="h-4 w-4" />
                Télécharger le PDF
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: PDF Viewer */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Aperçu</p>
          <div className="w-full bg-muted rounded-lg border border-input overflow-hidden flex flex-col">
            {/* PDF Canvas */}
            <div className="relative flex-1 overflow-auto flex items-center justify-center bg-gray-900 p-2 min-h-100 lg:min-h-150">
              {pdfLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900/50 rounded-t-lg">
                  <Spinner className="h-8 w-8 text-primary" />
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="shadow-lg max-w-full block"
              />
            </div>

            {/* Page Navigation */}
            {numPages && numPages > 1 && (
              <div className="flex items-center justify-center gap-4 p-4 border-t bg-background">
                <button
                  onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                  disabled={pageNumber <= 1}
                  className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Page précédente"
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
                  title="Page suivante"
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
