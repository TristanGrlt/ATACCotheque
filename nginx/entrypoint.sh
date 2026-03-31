#!/bin/sh

echo "⏳ Waiting for Meilisearch to be ready at http://meilisearch:7700..."

# Wait until Meilisearch returns a successful health check
until curl -s http://meilisearch:7700/health > /dev/null; do 
  sleep 2
done

echo "🔍 Fetching Default Search API Key..."

# Fetch the key using the MEILI_MASTER_KEY injected via docker-compose.yml
SEARCH_KEY=$(curl -s -H "Authorization: Bearer $MEILI_MASTER_KEY" http://meilisearch:7700/keys | jq -r '.results[] | select(.name=="Default Search API Key") | .key')

if [ -n "$SEARCH_KEY" ] && [ "$SEARCH_KEY" != "null" ]; then
    echo "✅ Key retrieved. Injecting into compiled Vite frontend..."

  # Escape replacement chars that are meaningful to sed (&, /, |, \)
  ESCAPED_SEARCH_KEY=$(printf '%s' "$SEARCH_KEY" | sed -e 's/[\\/&|]/\\&/g')

  # Replace placeholder with the real key in all generated JS bundles.
  find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s|MEILI_SEARCH_KEY_PLACEHOLDER|$ESCAPED_SEARCH_KEY|g" {} +

  # Verify replacement actually happened before booting nginx.
  if grep -R "MEILI_SEARCH_KEY_PLACEHOLDER" /usr/share/nginx/html/assets > /dev/null; then
    echo "❌ Placeholder key still present after injection. Refusing to start."
    exit 1
  fi
else
    echo "❌ Failed to fetch Search Key from Meilisearch. Nginx will not start."
    exit 1
fi

echo "🚀 Starting Nginx..."
exec nginx -g "daemon off;"