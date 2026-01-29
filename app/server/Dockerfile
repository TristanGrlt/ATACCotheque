FROM oven/bun:1 AS base
WORKDIR /app

# Étape d'installation et build
FROM base AS builder
COPY package.json bun.lockb tsconfig.json ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Étape finale
FROM base AS release
COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist
# Installation des dépendances de prod uniquement
RUN bun install --production

EXPOSE 3000

CMD ["bun", "dist/app.js"]
