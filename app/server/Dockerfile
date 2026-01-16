FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
RUN npm ci --only=production

# Copier le code source et le script de démarrage
COPY . .
RUN chmod +x /app/start.sh

# Générer le Prisma Client au moment du build
RUN npx prisma generate

EXPOSE 3000

# Utiliser le script de démarrage qui s'assure que la DB est à jour
ENTRYPOINT ["/app/start.sh"]
CMD ["npm", "start"]