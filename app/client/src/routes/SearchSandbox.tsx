import { useState, useEffect } from 'react';
import { MeiliSearch } from 'meilisearch';
import { Input } from "@/components/ui/input";
import { MEILI_HOST, MEILI_API_KEY } from '@/config/env';

const client = new MeiliSearch({
  host: MEILI_HOST,
  apiKey: MEILI_API_KEY
});

export function SearchSandbox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [status, setStatus] = useState('Idle');

  useEffect(() => {
    const performSearch = async () => {
      try {
        setStatus('Searching...');
        const search = await client.index('exams').search(query);
        console.log("Meili response:", search);
        setResults(search.hits);
        setStatus(search.hits.length > 0 ? 'Results found' : 'No results');
      } catch (err) {
        console.error(err);
        setStatus('Error connecting to Meilisearch');
      }
    };
    performSearch();
  }, [query]);

  return (
    <div className="p-10 space-y-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🧪 Search Sandbox</h1>
        <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">
          Status: {status}
        </span>
      </div>

      <Input
        placeholder="Type to search (e.g. 'Algebra')..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="grid gap-2">
        {results.length === 0 ? (
          <div className="text-center text-gray-500 py-10 border-2 border-dashed rounded-lg">
            Index is empty or no matches found. <br />
            <span className="text-xs">Did you run the seed script?</span>
          </div>
        ) : (
          results.map((hit, i) => (
            <div key={hit.id || i} className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
              <div className="font-bold text-lg">{hit.course}</div>
              <div className="text-sm text-muted-foreground flex gap-2">
                <span className="bg-secondary px-2 py-0.5 rounded">{hit.year}</span>
                <span className="bg-secondary px-2 py-0.5 rounded">{hit.level}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
