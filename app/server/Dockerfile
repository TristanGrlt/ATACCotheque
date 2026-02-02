FROM oven/bun:1 AS base
WORKDIR /app

# Étape d'installation et build
FROM base AS builder
COPY package.json bun.lock tsconfig.json ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile
RUN bunx prisma generate
COPY . .
RUN bun run build

# Étape finale
FROM base AS release
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/dist ./dist
RUN bun install --frozen-lockfile --production

EXPOSE 3000

# Lancer les migrations, seed, puis démarrer l'app
CMD ["sh", "-c", "bunx prisma migrate deploy && bunx prisma db seed && bun dist/app.js"]
