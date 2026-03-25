import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
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
import { Search as SearchIcon, SearchX, BookOpen, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface SearchResultFormatted {
  course?: string;
  title?: string;
  type?: string;
  level?: string;
  major?: string;
}

interface SearchHit extends SearchResult {
  _formatted?: SearchResultFormatted;
}

const HIGHLIGHT_PRE_TAG = '[[hl]]';
const HIGHLIGHT_POST_TAG = '[[/hl]]';

function renderHighlightedText(value?: string): ReactNode {
  if (!value) {
    return null;
  }

  if (!value.includes(HIGHLIGHT_PRE_TAG)) {
    return value;
  }

  const nodes: ReactNode[] = [];
  const segments = value.split(HIGHLIGHT_PRE_TAG);

  segments.forEach((segment, segmentIndex) => {
    if (segmentIndex === 0) {
      if (segment) {
        nodes.push(segment);
      }
      return;
    }

    const [highlighted, trailing = ''] = segment.split(HIGHLIGHT_POST_TAG);
    nodes.push(
      <mark key={`hl-${segmentIndex}`} className="rounded bg-amber-200 px-0.5 text-current">
        {highlighted}
      </mark>
    );

    if (trailing) {
      nodes.push(trailing);
    }
  });

  return <>{nodes}</>;
}

export function Search() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hitCount, setHitCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const [levelFilter, setLevelFilter] = useState('');
  const [majorFilter, setMajorFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [levels, setLevels] = useState<string[]>([]);
  const [majors, setMajors] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);

  const totalPages = Math.max(1, Math.ceil(hitCount / pageSize));

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

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
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setIsSearching(true);
      setError(null);

      const filters = [];
      if (levelFilter) filters.push(`level = "${levelFilter}"`);
      if (majorFilter) filters.push(`major = "${majorFilter}"`);
      if (typeFilter) filters.push(`type = "${typeFilter}"`);
      const filterString = filters.length > 0 ? filters.join(' AND ') : undefined;

      const search = await client.index('exams').search(debouncedQuery || '', {
        filter: filterString,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        attributesToHighlight: ['course', 'title', 'major', 'type', 'level'],
        highlightPreTag: HIGHLIGHT_PRE_TAG,
        highlightPostTag: HIGHLIGHT_POST_TAG
      }, {
        signal: controller.signal
      });

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setResults(search.hits as SearchHit[]);
      const totalHits = search.estimatedTotalHits || 0;
      setHitCount(totalHits);

      const computedTotalPages = Math.max(1, Math.ceil(totalHits / pageSize));
      if (page > computedTotalPages) {
        setPage(computedTotalPages);
      }
    } catch (err) {
      if (controller.signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
        return;
      }

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      console.error('Search error:', err);
      setError('Erreur lors de la recherche. Veuillez réessayer.');
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsSearching(false);
      }
    }
  }, [debouncedQuery, levelFilter, majorFilter, typeFilter, page, pageSize]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);



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
        <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher (ex: 'Algèbre', 'Analyse')..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
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
            onChange={(e) => {
              setLevelFilter(e.target.value);
              setPage(1);
            }}
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
            onChange={(e) => {
              setMajorFilter(e.target.value);
              setPage(1);
            }}
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
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tous les types</option>
            {types.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          Page {page} sur {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-sm text-muted-foreground">Par page</label>
          <select
            id="page-size"
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[12, 24, 48].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || isSearching}>
            Précédent
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages || isSearching}>
            Suivant
          </Button>
        </div>
      </div>

      {/* Results Grid */}
      <div className="relative min-h-24">
        {results.length === 0 && (query !== "" || levelFilter !== "" || majorFilter !== "" || typeFilter !== "") && !isSearching && !error && (
          <Alert variant="destructive">
            <SearchX className="h-4 w-4" />
            <AlertTitle>Aucun résultat</AlertTitle>
            <AlertDescription>
              Aucune ressource trouvée pour cette combinaison.
            </AlertDescription>
          </Alert>
        )}

        {results.length > 0 && (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity ${isSearching ? 'opacity-70' : 'opacity-100'}`}>
            {results.map((hit) => (
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
                        <CardTitle className="text-lg font-bold text-primary">
                          {renderHighlightedText(hit._formatted?.course ?? hit.course)}
                        </CardTitle>
                        {hit.title && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {renderHighlightedText(hit._formatted?.title ?? hit.title)}
                          </p>
                        )}
                      </div>
                      {hit.type && (
                        <Badge variant="default" className="whitespace-nowrap">
                          {renderHighlightedText(hit._formatted?.type ?? hit.type)}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3 items-center">
                      <Badge variant="secondary" className="gap-1">
                        <BookOpen className="h-3 w-3" />
                        {renderHighlightedText(hit._formatted?.major ?? hit.major)}
                      </Badge>
                      <Badge variant="outline">{renderHighlightedText(hit._formatted?.level ?? hit.level)}</Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground ml-auto">
                        <Calendar className="h-4 w-4" />
                        {hit.year}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {isSearching && (
          <div className={`pointer-events-none absolute inset-0 flex ${results.length > 0 ? 'items-start justify-end p-3' : 'items-center justify-center'}`}>
            <div className="flex items-center gap-2 rounded-md border bg-background/90 px-3 py-2 shadow-sm">
              <Spinner className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Mise à jour des résultats...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
