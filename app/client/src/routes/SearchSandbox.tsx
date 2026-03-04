import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
import { Search, SearchX, BookOpen, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MEILI_HOST, MEILI_API_KEY } from '@/config/env';

const client = new MeiliSearch({
  host: MEILI_HOST,
  apiKey: MEILI_API_KEY
});

interface SearchResult {
  id: string;
  course: string;
  type?: string;
  level: string;
  major: string;
  year: number;
  path: string;
  title?: string;
}

export function SearchSandbox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hitCount, setHitCount] = useState(0);

  const [levelFilter, setLevelFilter] = useState('');
  const [majorFilter, setMajorFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [levels, setLevels] = useState<string[]>([]);
  const [majors, setMajors] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);

  // Fetch available filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const emptySearch = await client.index('exams').search('', {
          limit: 1,
          facets: ['level', 'major', 'type']
        });
        
        if (emptySearch.facetDistribution) {
          setLevels(Object.keys(emptySearch.facetDistribution.level || {}).sort());
          setMajors(Object.keys(emptySearch.facetDistribution.major || {}).sort());
          setTypes(Object.keys(emptySearch.facetDistribution.type || {}).sort());
        }
      } catch (err) {
        console.error('Failed to fetch filter options', err);
      }
    };

    fetchFilterOptions();
  }, []);

  const performSearch = useCallback(async () => {
    try {
      setIsSearching(true);
      setError(null);

      const filters = [];
      if (levelFilter) filters.push(`level = "${levelFilter}"`);
      if (majorFilter) filters.push(`major = "${majorFilter}"`);
      if (typeFilter) filters.push(`type = "${typeFilter}"`);
      const filterString = filters.length > 0 ? filters.join(' AND ') : undefined;

      const search = await client.index('exams').search(query || '', {
        filter: filterString,
        limit: 200
      });

      setResults(search.hits as SearchResult[]);
      setHitCount(search.estimatedTotalHits || 0);
    } catch (err) {
      console.error('Search error:', err);
      setError('Erreur lors de la recherche. Veuillez réessayer.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [query, levelFilter, majorFilter, typeFilter]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);



  return (
    <div className="p-10 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Rechercher des Annales</h1>
          <p className="text-muted-foreground mt-1">
            {hitCount > 0 ? `${hitCount} résultats trouvés` : ''}
          </p>
        </div>
        {isSearching && <Spinner className="h-6 w-6 text-muted-foreground" />}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher (ex: 'Algèbre', 'Analyse')..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-11 text-base shadow-sm"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Niveau</label>
          <select
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="">Tous les niveaux</option>
            {levels.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Filière</label>
          <select
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={majorFilter}
            onChange={(e) => setMajorFilter(e.target.value)}
          >
            <option value="">Toutes les filières</option>
            {majors.map((major) => (
              <option key={major} value={major}>{major}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Type</label>
          <select
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Tous les types</option>
            {types.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid gap-4">
        {results.length === 0 && (query !== "" || levelFilter !== "" || majorFilter !== "" || typeFilter !== "") && !isSearching ? (
          <Alert variant="destructive">
            <SearchX className="h-4 w-4" />
            <AlertTitle>Aucun résultat</AlertTitle>
            <AlertDescription>
              Aucune ressource trouvée pour cette combinaison.
            </AlertDescription>
          </Alert>
        ) : (
          results.map((hit) => (
            <Link 
              key={hit.id} 
              to={`/exam/${hit.id}`}
              state={{ exam: hit }}
              className="no-underline"
            >
              <Card 
                className="hover:shadow-lg transition-all border-l-4 border-l-primary cursor-pointer"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-primary">{hit.course}</CardTitle>
                      {hit.title && <p className="text-sm text-muted-foreground mt-1">{hit.title}</p>}
                    </div>
                    {hit.type && (
                      <Badge variant="default" className="whitespace-nowrap">
                        {hit.type}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3 items-center">
                    <Badge variant="secondary" className="gap-1">
                      <BookOpen className="h-3 w-3" />
                      {hit.major}
                    </Badge>
                    <Badge variant="outline">{hit.level}</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground ml-auto">
                      <Calendar className="h-4 w-4" />
                      {hit.year}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
