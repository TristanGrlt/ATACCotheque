# ATACCothèque

Bienvenue sur L'ataccothèque, votre plateforme dédiée au stockage et à la consultation des annales universitaires. Notre association s'engage à collecter, organiser et rendre accessibles les anciens contrôles de fac afin de soutenir les étudiants dans leur préparation académique. Grâce à notre vaste bibliothèque numérique, vous pouvez facilement accéder aux ressources nécessaires pour réussir vos examens.

---

## Stack technique

### Frontend

Utilisation de la bibliothèque **React** pour l'interface utilisateur web avec l'outil de construction **Vite**. _React_ utilise le langage **TypeScript** pour une programmation typée.

Le projet utilise également les bibliothèques suivantes avec _React_ :

- **shadcn/ui** pour des composants de base qui respectent les règles d'accessibilité (basé sur _Radix UI_)
- **Tailwind CSS** car elle est une dépendance de _shadcn/ui_ et permet de garder une interface unifiée

### Backend

Utilisation de l'environnement d'exécution **Node.js** avec le framework **Express.js** qui utilise le langage **TypeScript** pour conserver les avantages d'un langage typé.

### PostgreSQL

Base de données relationnelle utilisée pour le stockage des données du projet. L'ORM **Prisma** est utilisé pour gérer les modèles et les migrations.

### Meilisearch

Moteur de recherche open source pour l'indexation des annales afin d'avoir une barre de recherche rapide et résiliente aux fautes de frappe.

### Nginx

Serveur proxy utilisé en entrée de ce projet pour gérer les routes.

Les routes suivantes sont disponibles :

- `/` pour le _frontend_
- `/api/` pour le _backend_ (API)
- `/file/` pour l'accès aux annales

## 🚀 Démarrage rapide

### Prérequis

- Docker
- Docker Compose

```bash
sudo apt-get update
sudo apt install ./docker-desktop-amd64.deb
```

### Développement

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Lancer l'environnement de développement
docker compose -f docker-compose.dev.yml up

# Ou avec reconstruction des images si vous modifiez les Dockerfile
docker compose -f docker-compose.dev.yml up --build

# En arrière-plan (détaché)
docker compose -f docker-compose.dev.yml up -d
```

L'application sera accessible sur :

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3000
- **Meilisearch** : http://localhost:7700
- **PostgreSQL** : localhost:5432
- **Adminer** (interface de gestion de base de données) : http://localhost:8080

**La méthode recommandé est d'utiliser le script `./start-dev-stack.sh` pour lancer la stack de production**

#### Base de donnés

La base de donné est un server PostgreSQL. La connexion et la création de tables est géré par l'ORM _Prisma_. En production, lancer le serveur avec la commande donné précédement.

**Si** les shéma ont été **modifier**, le serveur doit mettre à jour ces tables. Pour cella éxécuter la commande de migration suivante:

```bash
docker compose -f docker-compose.dev.yml exec backend bunx prisma migrate dev
```

**Si VOUS modifier** les shéma. Vous êtes donc responsable de ce changement et devait appliquer là aussi une migration mais cette fois si nomé. Pour cella, éxécuter la commande suivante:

```bash
docker compose -f docker-compose.dev.yml exec backend bunx prisma migrate dev --name <nom_changement>
```

En remplaçant `<nom_changement>` par une description de votre changement (à la manière d'un commit). Par exemple: `user_add_username_field`

Le fichier `app/server/prisma/seed.ts` contient les élément de base qui seront ajouté automatiquement au démarage du serveur de production mais qui doivent être éxécuté à la main durant la fase de production. Pour cella, à chaque que le fichier est modifié, éxécuté la commande suivante:

```bash
docker compose -f docker-compose.dev.yml exec backend bunx prisma db seed
```

### Production

```bash
# Lancer en production
docker compose up -d

# Avec reconstruction des images
docker compose up -d --build
```

L'application sera accessible sur http://localhost

#### Adminer - Interface de gestion de base de données

En développement, **Adminer** est disponible pour gérer facilement la base de données PostgreSQL via une interface web intuitive.

Accédez à Adminer sur : **http://localhost:8080**

**Informations de connexion :**

- **Système** : PostgreSQL
- **Serveur** : `postgres` (nom du service Docker)
- **Utilisateur** : Voir variable `POSTGRES_USER` dans `.env`
- **Mot de passe** : Voir variable `POSTGRES_PASSWORD` dans `.env`
- **Base de données** : Voir variable `POSTGRES_DB` dans `.env`

Adminer permet de :

- Visualiser la structure de la base de données
- Exécuter des requêtes SQL
- Gérer les tables, index et relations
- Importer/exporter des données
- Visualiser et éditer les données directement

> **Note** : Adminer n'est disponible qu'en environnement de développement pour des raisons de sécurité.

### Commandes utiles

```bash
# Voir les logs de tous les services
docker compose logs -f

# Voir les logs d'un service spécifique
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres

# Arrêter tous les services
docker compose down

# Arrêter et supprimer les volumes (⚠️ supprime les données)
docker compose down -v

# Reconstruire une image spécifique
docker compose build backend

# Arrêter les services (développement)
docker compose -f docker-compose.dev.yml down

# Arrêter les services (production)
docker compose down

# Arrêter et supprimer les volumes (attention : supprime la DB !)
docker compose down -v

# Redémarrer un service spécifique
docker compose restart backend

# Accéder au shell d'un container
docker compose exec backend sh
docker compose exec postgres psql -U ataccotheque_user -d ataccotheque_dev

# Voir l'état des services
docker compose ps
```

### Initialisation de la base de données

```bash
# Les migrations Prisma sont automatiquement exécutées au démarrage du backend
# Pour exécuter manuellement les migrations :
docker compose exec backend bunx prisma migrate dev

# Pour appliquer le seed (données initiales) :
docker compose exec backend bunx prisma db seed

# Ou entrer dans le container PostgreSQL
docker compose exec postgres psql -U ataccotheque_user -d ataccotheque_dev
```

### Développement sans Docker (optionnel)

Si vous préférez développer localement sans Docker, lancer et installer les différent éléments présents dans le fichier `docker-compose.dev.yml`

## 🛠️ Structure Docker

```
.
├── docker-compose.yml           # Configuration production
├── docker-compose.dev.yml       # Configuration développement
├── .env.example                 # Variables d'environnement exemple
├── nginx/
│   └── nginx.conf              # Configuration Nginx
├── app/
│   ├── client/
│   │   ├── Dockerfile          # Image production frontend
│   │   ├── Dockerfile.dev      # Image développement frontend
│   │   └── nginx.conf          # Config Nginx pour le frontend
│   └── server/
│       ├── Dockerfile          # Image production backend
│       └── Dockerfile.dev      # Image développement backend
```

## 📝 Variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
# PostgreSQL
POSTGRES_USER=changeMeInProduction
POSTGRES_PASSWORD=changeMeInProduction
POSTGRES_DB=ataccotheque
DATABASE_URL=postgresql://user:password@postgres:5432/ataccotheque

# Meilisearch
MEILI_MASTER_KEY=changeMeInProduction
MEILI_ENV=production

# Backend
NODE_ENV=production
JWT_SECRET=changeMeInProduction
```

## 🤝 Workflow de développement en équipe

### 1. Créer une issue

Avant de commencer à travailler sur une fonctionnalité ou un bug, **créez toujours une issue** sur GitHub décrivant :

- Le problème ou la fonctionnalité
- Les critères d'acceptation
- Les éventuelles contraintes techniques

### 2. Créer une branche liée à l'issue

**Chaque fonctionnalité ou correction doit avoir sa propre branche.**

Nomenclature des branches :

- `feat/numero-issue-description` pour une nouvelle fonctionnalité
- `fix/numero-issue-description` pour une correction de bug
- `docs/numero-issue-description` pour la documentation
- `refactor/numero-issue-description` pour du refactoring

Exemple :

```bash
# Pour l'issue #42 : Ajout de la recherche d'annales
git checkout -b feat/42-recherche-annales

# Pour l'issue #58 : Correction du bug de connexion
git checkout -b fix/58-bug-connexion
```

### 3. Développer avec des commits conventionnels

Suivez la convention [Conventional Commits](https://www.conventionalcommits.org/fr/v1.0.0/) pour vos messages de commit :

**Format de base :**

```
<type>[portée optionnelle]: <description>

[corps optionnel]

[pied de page optionnel]
```

**Types de commits :**

- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage, point-virgules manquants, etc.
- `refactor`: Refactorisation du code
- `test`: Ajout ou modification de tests
- `chore`: Maintenance, mise à jour des dépendances

**Exemples de commits :**

```bash
# Fonctionnalité simple
git commit -m "feat: ajout de la barre de recherche"

# Fonctionnalité avec portée
git commit -m "feat(auth): ajout de l'authentification par JWT"

# Correction de bug
git commit -m "fix: correction de l'affichage des annales"

# Avec description détaillée
git commit -m "feat(search): intégration de Meilisearch

- Configuration de l'index des annales
- Ajout de l'endpoint /api/search
- Interface de recherche dans le frontend"

# Breaking change (changement majeur)
git commit -m "feat(api)!: modification du format de réponse des annales

BREAKING CHANGE: le format de réponse de /api/annales a changé"
```

### 4. Pousser la branche et créer une Pull Request

```bash
# Pousser votre branche
git push origin feat/42-recherche-annales

# Créer une Pull Request sur GitHub
# La PR doit OBLIGATOIREMENT être liée à l'issue correspondante
```

**Template de Pull Request :**

```markdown
## Description

Brève description des changements apportés.

## Issue liée

Closes #42
```

### 5. Revue de code

- Au moins **une approbation** est requise avant le merge
- Adressez tous les commentaires de la revue
- Mettez à jour votre branche si nécessaire :
  ```bash
  git checkout main
  git pull
  git checkout feat/42-recherche-annales
  git merge main
  # Résoudre les conflits si nécessaire
  git push
  ```

### 6. Merge et nettoyage

Une fois la PR approuvée et mergée :

```bash
# Retourner sur main et mettre à jour
git checkout main
git pull

# Supprimer la branche locale
git branch -d feat/42-recherche-annales

# Supprimer la branche distante (si pas déjà fait automatiquement)
git push origin --delete feat/42-recherche-annales
```

### Exemple de workflow complet

```bash
# 1. Créer l'issue #42 sur GitHub

# 2. Créer et se déplacer sur la branche
git checkout -b feat/42-recherche-annales

# 3. Lancer l'environnement de développement
docker compose -f docker-compose.dev.yml up -d

# 4. Développer et commiter régulièrement
git add app/client/src/components/SearchBar.tsx
git commit -m "feat(search): ajout du composant SearchBar"

git add app/server/routes/search.js
git commit -m "feat(search): ajout de l'endpoint de recherche"

git add app/server/services/meilisearch.js
git commit -m "feat(search): intégration de Meilisearch"

# 5. Pousser et créer la PR
git push origin feat/42-recherche-annales
# Créer la PR sur GitHub et lier l'issue #42

# 6. Après merge, nettoyer
git checkout main
git pull
git branch -d feat/42-recherche-annales
```

### Règles importantes

✅ **À faire :**

- Créer une issue avant de commencer
- Une branche = une fonctionnalité/correction
- Utiliser Conventional Commits
- Lier les PR aux issues avec "Closes #XX"
- Faire des commits atomiques et réguliers
- Demander une revue de code

❌ **À éviter :**

- Travailler directement sur `main` (c'est impossible)
- Créer des branches sans issue associée
- Faire des commits sans message clair
- Mélanger plusieurs fonctionnalités dans une branche
- Merger sans revue de code

## 🔧 Dépannage

**Les containers ne démarrent pas ?**

```bash
docker compose down
docker compose up --build
```

**La base de données ne se connecte pas ?**

```bash
# Vérifier que MySQL est bien démarré
docker compose ps
# Voir les logs
docker compose logs mysql
```

**Port déjà utilisé ?**
Modifiez les ports dans `docker-compose.dev.yml` :

```yaml
ports:
  - "5174:5173" # Au lieu de 5173:5173
```

**Réinitialiser complètement l'environnement**

```bash
docker compose down -v
docker compose up --build
```
