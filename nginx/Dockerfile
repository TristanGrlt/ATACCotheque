FROM oven/bun:1 AS frontend-build
WORKDIR /app/client
COPY app/client/package.json app/client/bun.lock ./
RUN bun install --frozen-lockfile
COPY app/client .
ARG VITE_API_ENDPOINT=/api
ENV VITE_API_ENDPOINT=${VITE_API_ENDPOINT}
RUN bun run build

FROM nginx:alpine
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=frontend-build /app/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]