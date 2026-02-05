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
  const [isSearching, setIsSearching] = useState(false);

  // Add state for your filters
  const [levelFilter, setLevelFilter] = useState('');
  const [majorFilter, setMajorFilter] = useState('');

  useEffect(() => {
    const performSearch = async () => {
      try {
        setIsSearching(true);

        // Build the Meilisearch filter string
        const filters = [];
        if (levelFilter) filters.push(`level = "${levelFilter}"`);
        if (majorFilter) filters.push(`major = "${majorFilter}"`);
        const filterString = filters.join(' AND ');

        const search = await client.index('exams').search(query, {
          filter: filterString,
          limit: 20
        });

        setResults(search.hits);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [query, levelFilter, majorFilter]);

  return (
    <div className="p-10 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Test de recherche</h1>
        {isSearching && <Spinner className="h-6 w-6 text-muted-foreground" />}
      </div>

      {/* Filter Controls - Added simple selects for now */
      /* TODO: Replace custom styling with shadcn component */}
      <div className="flex gap-4">
        <select
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
        >
          <option value="">Niveau (Tout)</option>
          <option value="L1">L1</option>
          <option value="L2">L2</option>
          <option value="L3">L3</option>
          <option value="M1">M1</option>
          <option value="M2">M2</option>
        </select>

        <select
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={majorFilter}
          onChange={(e) => setMajorFilter(e.target.value)}
        >
          <option value="">Filière (Toutes)</option>
          <option value="Informatique">Informatique</option>
          <option value="Mathématiques">Mathématiques</option>
          <option value="Physique">Physique</option>
        </select>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher (ex: 'Algèbre')..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-11 text-base shadow-sm"
        />
      </div>

      <div className="grid gap-4">
        {results.length === 0 && (query !== "" || levelFilter !== "" || majorFilter !== "") && !isSearching ? (
          <Alert variant="destructive">
            <SearchX className="h-4 w-4" />
            <AlertTitle>Aucun résultat</AlertTitle>
            <AlertDescription>
              Aucune ressource trouvée pour cette combinaison.
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
                    {hit.level}
                  </span>
                  <span className="bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium ml-auto">
                    Année: {hit.year}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
