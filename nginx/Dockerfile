FROM oven/bun:1 AS frontend-build
WORKDIR /app/client
COPY app/client/package.json app/client/bun.lock ./
RUN bun install --frozen-lockfile
COPY app/client .
ARG VITE_API_ENDPOINT=/api
ENV VITE_API_ENDPOINT=${VITE_API_ENDPOINT}
ARG VITE_MEILI_API_KEY=ecba5a5016dcbec142710846d0a15bf2827a2e742ba293db45a4b5cb8481be87
ENV VITE_MEILI_API_KEY=${VITE_MEILI_API_KEY}
RUN bun run build

FROM nginx:alpine
# On copie la config dans conf.d au lieu d'écraser la config globale
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /app/client/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]