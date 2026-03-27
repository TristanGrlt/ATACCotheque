# --- BUILD STAGE ---
FROM oven/bun:1 AS frontend-build
WORKDIR /app/client

COPY app/client/package.json app/client/bun.lock ./
RUN bun install --frozen-lockfile

COPY app/client .

# Pass through normal variables
ARG VITE_API_ENDPOINT
ENV VITE_API_ENDPOINT=${VITE_API_ENDPOINT}
ARG VITE_MEILI_HOST
ENV VITE_MEILI_HOST=${VITE_MEILI_HOST}
# Hardcoded placeholder key, will be replaced at runtime by the entrypoint script
ENV VITE_MEILI_API_KEY="MEILI_SEARCH_KEY_PLACEHOLDER"

RUN bun run build


# --- RUN STAGE ---
FROM nginx:alpine

# Install curl and jq for the entrypoint script to fetch the key
RUN apk add --no-cache curl jq

COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the compiled frontend from the bun builder
COPY --from=frontend-build /app/client/dist /usr/share/nginx/html

# Add the entrypoint script
COPY nginx/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]