FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY tsconfig.json ./

# Installer toutes les dépendances (y compris devDependencies pour build)
RUN npm ci

# Copier le code source
COPY . .

# Build l'application TypeScript
RUN npm run build

# Nettoyer les devDependencies après le build
RUN npm prune --production

EXPOSE 3000

CMD ["node", "dist/app.js"]