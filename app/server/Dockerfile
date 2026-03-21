FROM oven/bun:latest AS base
WORKDIR /app

# Étape d'installation et build
FROM base AS builder
COPY package.json bun.lock tsconfig.json ./
COPY prisma ./prisma
ENV PRISMA_CLIENT_ENGINE_TYPE=binary
RUN bun install --frozen-lockfile
RUN bunx prisma generate
COPY . .
RUN bun run build

# Étape finale
FROM base AS release
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lock ./
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/dist ./dist

# On installe UNIQUEMENT les dépendances de prod, et on génère le client Prisma dedans
RUN bun install --frozen-lockfile --production
RUN bunx prisma generate

EXPOSE 3000

# Lancer les migrations, puis démarrer l'app (j'ai enlevé seed comme tes logs indiquent qu'il fail s'il a déjà été fait)
CMD ["sh", "-c", "bunx prisma migrate deploy && bun dist/app.js"]