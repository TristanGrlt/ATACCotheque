FROM oven/bun:1 AS frontend-build
WORKDIR /app/client
COPY app/client/package.json app/client/bun.lock ./
RUN bun install --frozen-lockfile
COPY app/client .
ARG VITE_API_ENDPOINT
ENV VITE_API_ENDPOINT=${VITE_API_ENDPOINT}
ARG VITE_MEILI_API_KEY
ENV VITE_MEILI_API_KEY=${VITE_MEILI_API_KEY}
ARG VITE_MEILI_HOST
ENV VITE_MEILI_HOST=${VITE_MEILI_HOST}
RUN bun run build

FROM nginx:alpine
# On copie la config dans conf.d au lieu d'écraser la config globale
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /app/client/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]