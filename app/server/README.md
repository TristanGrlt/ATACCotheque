# Backend Server - Express + TypeScript

## Structure du projet

Le backend utilise Express.js avec TypeScript pour un typage fort et une meilleure maintenabilité.

## Configuration

### Installation des dépendances

```bash
npm install
```

### Variables d'environnement

Copiez `.env.example` vers `.env` et ajustez les valeurs selon votre environnement.

## Scripts disponibles

- `npm run dev` : Lance le serveur en mode développement avec hot-reload
- `npm run build` : Compile le TypeScript en JavaScript dans le dossier `dist/`
- `npm start` : Lance le serveur en production (nécessite un build préalable)

## Docker

### Développement

Le Dockerfile de développement (`Dockerfile.dev`) :

- Installe ts-node et nodemon globalement
- Monte le code source via volume pour le hot-reload
- Exécute `npm run dev` pour démarrer avec nodemon

### Production

Le Dockerfile de production (`Dockerfile`) :

- Compile le TypeScript en JavaScript
- N'installe que les dépendances de production après le build
- Exécute le code compilé avec Node.js

### Ajout d'une nouvelle dépendance

Quand vous ajoutez une nouvelle library :

1. **En local** :

   ```bash
   npm install nouvelle-library
   # ou pour une dev dependency
   npm install --save-dev nouvelle-library
   ```

2. **Reconstruire les images Docker** :

   ```bash
   # Pour le développement
   docker compose -f docker-compose.dev.yml up --build

   # Pour la production
   docker compose up --build
   ```

Le cache de Docker détectera le changement dans `package.json` et réinstallera les dépendances.

### Optimisation du cache Docker

Les Dockerfiles sont optimisés pour utiliser le cache Docker :

- On copie d'abord `package*.json` et `tsconfig.json`
- On installe les dépendances
- On copie ensuite le code source

Ainsi, si seul le code change, Docker réutilise les dépendances en cache. Si `package.json` change, Docker réinstalle les dépendances.

## Types TypeScript

Les types pour Express et Node.js sont installés en tant que devDependencies :

- `@types/express`
- `@types/node`
