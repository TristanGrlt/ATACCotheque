#!/bin/sh

# Fail fast if master key is missing
if [ -z "$MEILI_MASTER_KEY" ]; then
    echo "❌ ERROR: MEILI_MASTER_KEY is missing in dev environment!"
    exit 1
fi

echo "⏳ Waiting for Dev Meilisearch to be ready at http://meilisearch:7700..."
until curl -s http://meilisearch:7700/health > /dev/null; do 
  sleep 2
done

echo "🔍 Fetching Dev Search API Key..."
# Fetch and export the key. Exporting makes it available to the 'bun run dev' command that runs next.
export VITE_MEILI_API_KEY=$(curl -s -H "Authorization: Bearer $MEILI_MASTER_KEY" http://meilisearch:7700/keys | jq -r '.results[] | select(.name=="Default Search API Key") | .key')

if [ -n "$VITE_MEILI_API_KEY" ] && [ "$VITE_MEILI_API_KEY" != "null" ]; then
    echo "✅ Dev Key retrieved! Injecting into Vite server environment."
else
    echo "❌ Failed to fetch Search Key from Meilisearch."
    exit 1
fi

echo "🚀 Starting Vite Dev Server..."
# This executes the CMD passed from docker-compose (bun run dev)
exec "$@"