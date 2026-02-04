# Stage de build avec Bun
FROM oven/bun:1 AS builder

WORKDIR /app
ARG VITE_API_ENDPOINT=/api

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
ENV VITE_API_ENDPOINT=${VITE_API_ENDPOINT}
RUN bun run build

# Stage de production (reste sur Nginx)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]