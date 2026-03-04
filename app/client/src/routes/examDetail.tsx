import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useState, useEffect } from 'react';
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
import { BookOpen, Calendar, Archive, FileText, ArrowLeft, Download } from "lucide-react";
import { MEILI_HOST, MEILI_API_KEY } from '@/config/env';

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

  const fetchExam = useCallback(async () => {
    if (!examId) return;

    try {
      setIsLoading(true);
      setError(null);

      const search = await client.index('exams').search('', {
        limit: 1000
      });

      const found = search.hits.find((hit: any) => hit.id === examId);
      
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
          onClick={() => navigate('/sandbox')}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6"
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
    <div className="p-10 space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/sandbox')}
        className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la recherche
      </button>

      {/* Main Content */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-6">
          <div className="space-y-4">
            <div>
              <CardTitle className="text-3xl font-bold text-primary mb-2">
                {exam.course}
              </CardTitle>
              {exam.title && (
                <p className="text-lg text-muted-foreground">{exam.title}</p>
              )}
            </div>

            {/* Metadata Badges */}
            <div className="flex flex-wrap gap-3">
              {exam.type && (
                <Badge variant="default" className="text-base px-3 py-1">
                  {exam.type}
                </Badge>
              )}
              <Badge variant="secondary" className="text-base px-3 py-1 gap-2">
                <BookOpen className="h-4 w-4" />
                {exam.major}
              </Badge>
              <Badge variant="outline" className="text-base px-3 py-1">
                {exam.level}
              </Badge>
              <Badge variant="outline" className="text-base px-3 py-1 gap-2">
                <Calendar className="h-4 w-4" />
                {exam.year}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* File Path */}
          <div className="space-y-2 p-4 bg-accent rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Archive className="h-4 w-4" />
              Chemin d'accès
            </div>
            <p className="text-sm text-muted-foreground font-mono break-all">{exam.path}</p>
          </div>

          {/* Download Section */}
          <div className="pt-4 border-t">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
              <Download className="h-4 w-4" />
              Télécharger le PDF
            </button>
            <p className="text-xs text-muted-foreground mt-2">
              Fonctionnalité de téléchargement à venir
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
