import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MeiliSearch } from "meilisearch";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import {
  Search as SearchIcon,
  SearchX,
  Calendar,
  Layers,
  GraduationCap,
  FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MEILI_HOST, MEILI_API_KEY } from "@/config/env";
import { getIconByName } from "@/config/icons";

const client = new MeiliSearch({
  host: MEILI_HOST,
  apiKey: MEILI_API_KEY,
});

// Added strictly typed nested major to avoid using 'any'
interface MajorData {
  name: string;
  icon?: string | null;
}

interface SearchResult {
  id: string;
  course: string;
  type?: string;
  level: string;
  parcours: string;
  year: number;
  title?: string;
  majors?: MajorData[]; // The array Meilisearch likely returns based on your facets
}

interface SearchResultFormatted {
  course?: string;
  title?: string;
  type?: string;
  level?: string;
  major?: string;
  parcours?: string;
}

interface SearchHit extends SearchResult {
  _formatted?: SearchResultFormatted;
}

const HIGHLIGHT_PRE_TAG = "[[hl]]";
const HIGHLIGHT_POST_TAG = "[[/hl]]";

const sectionMotion = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
  viewport: { once: true, amount: 0.2 },
};

const STACK_ICON_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700",
  "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-100 dark:border-emerald-700",
  "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900 dark:text-amber-100 dark:border-amber-700",
  "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900 dark:text-violet-100 dark:border-violet-700",
  "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900 dark:text-rose-100 dark:border-rose-700",
  "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900 dark:text-cyan-100 dark:border-cyan-700",
];

function getStackIconColor(key: string): string {
  if (!key) return STACK_ICON_COLORS[0];

  const hash = key.split("").reduce((acc, char) => {
    const hashVal = (acc << 5) - acc + char.charCodeAt(0);
    return hashVal | 0;
  }, 0);

  return STACK_ICON_COLORS[Math.abs(hash) % STACK_ICON_COLORS.length];
}

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

    const [highlighted, trailing = ""] = segment.split(HIGHLIGHT_POST_TAG);
    nodes.push(
      <mark
        key={`hl-${segmentIndex}`}
        className="rounded bg-amber-200 px-0.5 text-current"
      >
        {highlighted}
      </mark>,
    );

    if (trailing) {
      nodes.push(trailing);
    }
  });

  return <>{nodes}</>;
}

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const initialMajorFilter = searchParams.get("major") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hitCount, setHitCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const lastPushedQ = useRef(initialQuery);

  const [levelFilter, setLevelFilter] = useState("");
  const [majorFilter, setMajorFilter] = useState(initialMajorFilter);
  const [typeFilter, setTypeFilter] = useState("");

  const [levels, setLevels] = useState<string[]>([]);
  const [majors, setMajors] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);

  const totalPages = Math.max(1, Math.ceil(hitCount / pageSize));

  useEffect(() => {
    const nextQuery = searchParams.get("q") ?? "";
    const nextMajor = searchParams.get("major") ?? "";

    if (nextQuery !== lastPushedQ.current) {
      setQuery(nextQuery);
      setDebouncedQuery(nextQuery);
      lastPushedQ.current = nextQuery;
      setPage(1);
    }

    if (nextMajor !== majorFilter) {
      setMajorFilter(nextMajor);
      setPage(1);
    }
  }, [searchParams, majorFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);

      if (lastPushedQ.current !== query) {
        lastPushedQ.current = query;

        setSearchParams(
          (prevParams) => {
            const nextParams = new URLSearchParams(prevParams);
            if (query) {
              nextParams.set("q", query);
            } else {
              nextParams.delete("q");
            }
            return nextParams;
          },
          { replace: true },
        );
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, setSearchParams]);

  // Fetch available filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const emptySearch = await client.index("exams").search("", {
          limit: 1,
          facets: ["level", "majors.name", "parcours", "type"],
        });

        if (emptySearch.facetDistribution) {
          setLevels(
            Object.keys(emptySearch.facetDistribution.level || {}).sort(),
          );
          setMajors(
            Object.keys(
              emptySearch.facetDistribution["majors.name"] || {},
            ).sort(),
          );
          setTypes(
            Object.keys(emptySearch.facetDistribution.type || {}).sort(),
          );
        }
      } catch (err) {
        console.error("Failed to fetch filter options", err);
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
      if (majorFilter) filters.push(`majors.name = "${majorFilter}"`);
      if (typeFilter) filters.push(`type = "${typeFilter}"`);
      const filterString =
        filters.length > 0 ? filters.join(" AND ") : undefined;

      const search = await client.index("exams").search(
        debouncedQuery || "",
        {
          filter: filterString,
          limit: pageSize,
          offset: (page - 1) * pageSize,
          attributesToHighlight: [
            "course",
            "title",
            "majors.name",
            "type",
            "level",
          ],
          highlightPreTag: HIGHLIGHT_PRE_TAG,
          highlightPostTag: HIGHLIGHT_POST_TAG,
        },
        {
          signal: controller.signal,
        },
      );

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
      if (
        controller.signal.aborted ||
        (err instanceof Error && err.name === "AbortError")
      ) {
        return;
      }

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      console.error("Search error:", err);
      setError("Erreur lors de la recherche. Veuillez réessayer.");
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
    <motion.div
      className="min-h-screen bg-animated-gradient flex flex-col items-center sm:pt-5 px-4 sm:px-6 md:px-10 pb-32 font-sans text-foreground selection:bg-primary/20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* --- Hero Section --- */}
      <motion.div
        className="text-center pt-8 sm:pt-12 pb-8 px-4"
        {...sectionMotion}
      >
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">
          <span className="text-primary">Rechercher</span> des Annales
        </h1>
        <p className="text-sm text-muted-foreground">
          Recherchez parmi des centaines d'annales de contrôles passés,
          filtrables par cours, matière, niveau et plus encore.
        </p>
      </motion.div>

      {error && (
        <Alert variant="destructive" className="mb-6 w-full max-w-4xl">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search Input */}
      <motion.div
        className="w-full max-w-2xl mx-auto px-4 mb-8 relative"
        {...sectionMotion}
      >
        <form
          className="relative group background bg-background/80 rounded-full"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="text-muted-foreground w-4 h-4" />
          </div>
          <Input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="pl-10 py-6 text-sm w-full rounded-full"
            placeholder="Chercher par un cours, une matière, un niveau..."
          />
        </form>
      </motion.div>

      {/* Filters */}
      <motion.div className="w-full max-w-4xl mb-8" {...sectionMotion}>
        <div className="flex gap-3 overflow-x-auto pb-2 sm:gap-6 sm:overflow-visible">
          <div className="space-y-3 shrink-0 min-w-[calc(50%-0.75rem)] sm:min-w-auto sm:flex-1">
            <Label
              htmlFor="level-filter"
              className="flex items-center gap-2 font-semibold text-foreground text-sm"
            >
              <div className="p-1.5 rounded-md bg-primary/10">
                <Layers className="h-4 w-4 text-primary" />
              </div>
              Niveau
            </Label>
            <Select
              value={levelFilter === "" ? "all" : levelFilter}
              onValueChange={(value) => {
                setLevelFilter(value === "all" ? "" : value);
                setPage(1);
              }}
            >
              <SelectTrigger
                id="level-filter"
                className="w-full bg-background/80! hover:bg-background! transition-colors"
              >
                <SelectValue placeholder="Tous les niveaux" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                {levels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 shrink-0 min-w-[calc(50%-0.75rem)] sm:min-w-auto sm:flex-1">
            <Label
              htmlFor="major-filter"
              className="flex items-center gap-2 font-semibold text-foreground text-sm"
            >
              <div className="p-1.5 rounded-md bg-primary/10">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              Filière
            </Label>
            <Select
              value={majorFilter === "" ? "all" : majorFilter}
              onValueChange={(value) => {
                const nextMajor = value === "all" ? "" : value;
                setMajorFilter(nextMajor);
                setPage(1);

                const nextSearchParams = new URLSearchParams(searchParams);
                if (nextMajor) {
                  nextSearchParams.set("major", nextMajor);
                } else {
                  nextSearchParams.delete("major");
                }
                setSearchParams(nextSearchParams, { replace: true });
              }}
            >
              <SelectTrigger
                id="major-filter"
                className="w-full bg-background/80! hover:bg-background! transition-colors"
              >
                <SelectValue placeholder="Toutes les filières" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les filières</SelectItem>
                {majors.map((major) => (
                  <SelectItem key={major} value={major}>
                    {major}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 shrink-0 min-w-[calc(50%-0.75rem)] sm:min-w-auto sm:flex-1">
            <Label
              htmlFor="type-filter"
              className="flex items-center gap-2 font-semibold text-foreground text-sm"
            >
              <div className="p-1.5 rounded-md bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              Type
            </Label>
            <Select
              value={typeFilter === "" ? "all" : typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value === "all" ? "" : value);
                setPage(1);
              }}
            >
              <SelectTrigger
                id="type-filter"
                className="w-full bg-background/80! hover:bg-background! transition-colors"
              >
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      <div className="flex items-center justify-between gap-3 mb-6 w-full max-w-4xl">
        <div className="text-sm text-muted-foreground">
          Page {page} sur {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Label
            htmlFor="page-size"
            className="text-sm text-muted-foreground mr-2"
          >
            Par page
          </Label>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger id="page-size" className="w-20 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[12, 24, 48].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || isSearching}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            disabled={page >= totalPages || isSearching}
          >
            Suivant
          </Button>
        </div>
      </div>

      {/* Results Grid */}
      <div className="relative min-h-24 w-full max-w-4xl">
        {results.length === 0 &&
          (query !== "" ||
            levelFilter !== "" ||
            majorFilter !== "" ||
            typeFilter !== "") &&
          !isSearching &&
          !error && (
            <Alert variant="destructive">
              <SearchX className="h-4 w-4" />
              <AlertTitle>Aucun résultat</AlertTitle>
              <AlertDescription>
                Aucune ressource trouvée pour cette combinaison.
              </AlertDescription>
            </Alert>
          )}

        {results.length > 0 && (
          <motion.div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity ${isSearching ? "opacity-70" : "opacity-100"}`}
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: {} }}
          >
            {results.map((hit, index) => {
              const majorEntries = hit.majors ?? [];

              // Build a compact icon stack and expand it on hover for multi-major courses.
              const iconsToRender = (
                majorEntries.length > 0
                  ? majorEntries
                  : [{ name: "default", icon: "FileText" }]
              ).slice(0, 3);
              const remainingIcons = Math.max(
                0,
                majorEntries.length - iconsToRender.length,
              );
              return (
                <motion.div
                  key={hit.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * (index % 6), duration: 0.3 }}
                  whileHover={{ translateY: -3 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Link
                    to={`/exam/${hit.id}`}
                    state={{ exam: hit }}
                    className="no-underline focus:outline-none block h-full"
                  >
                    <Card className="group relative p-4 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md border border-border/50 hover:border-primary/50 h-full flex flex-col bg-card">
                      {/* --- En-tête de la carte --- */}
                      <div className="flex items-start gap-3 ">
                        {/* Icône colorée dynamique */}
                        <div className="relative w-12 h-11 shrink-0">
                          {iconsToRender.map((major, iconIndex) => {
                            const iconKey =
                              major.icon || major.name || "default";
                            const IconComponent = getIconByName(iconKey);
                            const iconColors = getStackIconColor(iconKey);

                            return (
                              <div
                                key={`${hit.id}-${iconKey}-${iconIndex}`}
                                className={`absolute w-9 h-9 rounded-lg flex items-center justify-center border shadow-md ring-1 ring-background transition-all duration-150 ease-out ${iconColors} ${
                                  iconIndex === 0
                                    ? "z-30"
                                    : iconIndex === 1
                                      ? "z-20 group-hover:translate-x-3 group-hover:-translate-y-1"
                                      : "z-10 group-hover:translate-x-6 group-hover:-translate-y-2"
                                }`}
                                style={{
                                  left: `${iconIndex * 6}px`,
                                  top: `${iconIndex * 2}px`,
                                }}
                              >
                                <IconComponent className="w-4 h-4" />
                              </div>
                            );
                          })}
                          {remainingIcons > 0 && (
                            <div className="absolute -right-1 -bottom-1 z-40 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center border border-background">
                              +{remainingIcons}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 pt-0.5">
                          <h3 className="font-bold text-base text-foreground leading-tight flex flex-wrap gap-x-1">
                            <span>
                              {renderHighlightedText(
                                hit._formatted?.level ?? hit.level,
                              )}
                            </span>
                            <span>
                              {renderHighlightedText(
                                hit._formatted?.parcours ?? hit.parcours,
                              )}
                            </span>
                            <span>
                              {renderHighlightedText(
                                hit._formatted?.course ?? hit.course,
                              )}
                            </span>
                          </h3>
                        </div>
                      </div>

                      {/* --- Badges en bas de carte --- */}
                      <div className="mt-auto pt-2 flex items-center gap-2">
                        {/* Badge du Type (ex: CC2) */}
                        {hit.type && (
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent text-xs font-semibold px-2 py-0.5"
                          >
                            {renderHighlightedText(
                              hit._formatted?.type ?? hit.type,
                            )}
                          </Badge>
                        )}

                        <Badge
                          variant="outline"
                          className="text-xs font-medium text-muted-foreground border-border/50 bg-muted/30 px-2 py-0.5 flex items-center gap-1"
                        >
                          <Calendar className="w-3 h-3" />
                          {hit.year}
                        </Badge>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
        <AnimatePresence>
          {isSearching && (
            <motion.div
              className={`pointer-events-none absolute inset-0 flex ${results.length > 0 ? "items-start justify-end p-3" : "items-center justify-center"}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="flex items-center gap-2 rounded-md border bg-background/90 px-3 py-2 shadow-sm"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Spinner className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Mise à jour des résultats...
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
