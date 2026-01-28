# Stage de build
FROM node:20-alpine AS builder

WORKDIR /app

# Arguments de build
ARG VITE_API_ENDPOINT=/api

# Copier les fichiers de dépendances
COPY package*.json ./
RUN npm ci

# Copier le reste des fichiers
COPY . .

# Définir les variables d'environnement pour le build
ENV VITE_API_ENDPOINT=${VITE_API_ENDPOINT}

# Build de l'application
RUN npm run build

# Stage de production
FROM nginx:alpine

# Copier le build dans nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la configuration nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]