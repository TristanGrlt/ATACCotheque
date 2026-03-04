import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export function ExamIndex() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          Gestion des Annales
        </h1>
        <p className="text-muted-foreground mt-2">
          Gérez les examens et les annales de l'ATACCothèque
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Examen en développement</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Cette page sera complétée avec :
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
            <li>Tableau de gestion des annales</li>
            <li>Upload de fichiers PDF</li>
            <li>Édition des métadonnées</li>
            <li>Suppression avec confirmation</li>
            <li>Filtres et pagination</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
