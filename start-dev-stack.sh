#!/usr/bin/env bash

# Script pour démarrer la stack de production
# 1. Supprime les node_modules du client et du serveur
# 2. Lance la stack avec docker compose
# 3. Supprime à nouveau les node_modules
# 4. Fait npm install dans client et server

set -e

cd "$(dirname "$0")"

echo "Starting ..."

echo "[2/3] npm install terminé."

# 3. Lancer la stack docker compose
docker compose -f docker-compose.dev.yml up --build -d

# 1. Suppression des node_modules
sudo rm -rf app/client/node_modules app/server/node_modules

echo "[1/3] node_modules supprimés."

# 2. npm install dans client et server
# Cela assure que les dossiers node_modules existent avec les permissions de l'utilisateur
# avant que Docker ne monte les volumes.
echo "Installation des dépendances locales..."
cd app/client && npm install && cd -
cd app/server && npm install && cd -

# Trigger hot reload
touch app/server/app.ts

docker compose -f docker-compose.dev.yml up

echo "[3/3] Stack de dev démarrée."
