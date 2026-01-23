import { useState, useEffect } from 'react';
import { MeiliSearch } from 'meilisearch';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card";
import {
  Alert,
  AlertTitle,
  AlertDescription
} from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Search, SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MEILI_HOST, MEILI_API_KEY } from '@/config/env';

const client = new MeiliSearch({
  host: MEILI_HOST,
  apiKey: MEILI_API_KEY
});

export function SearchSandbox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [status, setStatus] = useState('Attente');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Create a timer to delay the search
    const delayDebounceFn = setTimeout(async () => {
      try {
        setStatus('Recherche...');
        const search = await client.index('exams').search(query);
        setResults(search.hits);
        setStatus(search.hits.length > 0 ? `${search.hits.length} résultats` : 'Aucun résultat');
      } catch (err) {
        console.error(err);
        setStatus('Erreur de connexion');
      }
    }, 300); // 300ms delay

    // Cleanup function: clear the timer if the user types again before 300ms
    return () => clearTimeout(delayDebounceFn);
  }, [query]);
  return (
    <div className="p-10 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Test de recherche 🧪</h1>
        {isSearching && <Spinner className="h-6 w-6 text-muted-foreground" />}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher (ex: 'Algèbre', 'S2')..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-11 text-base shadow-sm"
        />
      </div>

      <div className="grid gap-4">
        {results.length === 0 && query !== "" && !isSearching ? (
          <Alert variant="destructive">
            <SearchX className="h-4 w-4" />
            <AlertTitle>Aucun résultat</AlertTitle>
            <AlertDescription>
              Aucune ressource trouvée pour "{query}".
            </AlertDescription>
          </Alert>
        ) : (
          results.map((hit) => (
            <Card key={hit.id} className="hover:bg-accent/50 transition-all border-l-4 border-l-primary">
              <CardHeader className="py-4">
                <CardTitle className="text-xl font-bold text-primary">{hit.course}</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold italic">
                    {hit.major}
                  </span>
                  <span className="bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full font-medium">
                    Cycle: {hit.level} • {hit.semester}
                  </span>
                  <span className="bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium ml-auto">
                    Année: {hit.year}
                  </span>
                </div>
                <div className="mt-3 text-sm text-right font-bold text-muted-foreground italic">
                  {hit.examType}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
