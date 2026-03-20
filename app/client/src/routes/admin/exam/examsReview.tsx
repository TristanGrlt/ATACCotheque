import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export function ExamsReview() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CheckCircle2 className="h-8 w-8" />
          Révision des Annales
        </h1>
        <p className="text-muted-foreground mt-2">
          Acceptez ou rejetez les nouvelles annales soumises
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
            <li>Liste des annales en attente de révision</li>
            <li>Aperçu des métadonnées et du PDF</li>
            <li>Boutons d'acceptation/rejet</li>
            <li>Commentaires et notes</li>
            <li>Historique de révision</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
