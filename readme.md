# <img src="app/client/public/atacc_logo.png" width="70"> ATACCothèque

Bienvenue sur L'ataccothèque, votre plateforme dédiée au stockage et à la consultation des annales universitaires. Notre association s'engage à collecter, organiser et rendre accessibles les anciens contrôles de fac afin de soutenir les étudiants dans leur préparation académique. Grâce à notre vaste bibliothèque numérique, vous pouvez facilement accéder aux ressources nécessaires pour réussir vos examens.

---

## Stack technique

### Frontend

Utilisation de la bibliothèque **React** avec l'outil de construction **Vite**. Utilisation du langage **TypeScript**. Fonctionne sur l'environnement d'exécution **Bun**.

Les bibliothèques suivantes sont utilisées :

- **shadcn/ui** pour des composants de base qui respectent les règles d'accessibilité (basé sur _Radix UI_)
- **Tailwind CSS** (dépendance de _shadcn/ui_)
- **axios** pour les requêtes API
- **lucide-react** pour des icônes open source

### Backend

Utilisation du framework **Express.js**. Utilisation du langage **TypeScript**. Fonctionne sur l'environnement d'exécution **Bun**.

Les bibliothèques suivantes sont utilisées :

- **Prisma**, l'ORM utilisé pour la gestion de la base de données PostgreSQL
- **jsonwebtoken** pour l'authentification à l'API

### PostgreSQL

Base de données relationnelle.

### Meilisearch

Moteur de recherche open source pour l'indexation des annales afin d'avoir une barre de recherche rapide et résiliente aux fautes de frappe.

### Nginx

Serveur proxy utilisé en entrée de ce projet pour gérer les routes.

Les routes suivantes sont disponibles :

- `/` pour le _frontend_
- `/api/` pour le _backend_ (API)
- `/file/` pour l'accès aux annales

---

## Démarrage

### Prérequis

- Docker
- Docker Compose

### Développement

#### 1. Lancement de l'environnement de développement

```bash
# Lancer l'environnement de développement
docker compose -f docker-compose.dev.yml up

# Ou avec reconstruction des images si vous modifiez les Dockerfile ou les dépendances
docker compose -f docker-compose.dev.yml up --build

# En arrière-plan (détaché)
docker compose -f docker-compose.dev.yml up -d
```

#### 2. Configuration

Un élément en particulier nécessite une configuration pour être utilisé dans l'environnement d'exécution. En effet, l'ORM _Prisma_ doit être configuré afin de gérer les migrations de base de données (ses tables) ainsi que son "client" pour les interactions avec la base de données. Cette configuration se fait par l'intermédiaire de l'exécution de quelques commandes.

Lors du **premier démarage** de l'environnement d'exécution ou à **chaque modification** des schémas pour la base de données, les modifications qui ont été apportées doivent être répercutées sur votre serveur de développement. On appelle cette action "appliquer les migrations de la base de données". Ces migrations sont disponibles dans le dossier du même nom sous la forme de fichiers SQL. Afin de réaliser cette migration, exécuter la commande suivante :

```bash
# Appliquer les migrations à la base de données.
docker compose -f docker-compose.dev.yml exec backend bunx prisma migrate dev
```

L'utilisation de _Prisma_ repose aussi sur son "client" qui est généré en fonction des schémas définis. Lors du **premier démarage** de l'environnement d'exécution ou à **chaque modification** des schémas pour la base de données, un nouveau "client" doit être généré. Pour cela, exécuter la commande suivante :

```bash
# Générer le client Prisma.
docker compose -f docker-compose.dev.yml exec backend bunx prisma generate
```

Afin de peupler la base de données, vous avez la possibilité d'exécuter la commande suivante afin d'initialiser la base de données. Ce procédé est appelé seeding.

```bash
# Appliquer le seeding sur la base de données
docker compose -f docker-compose.dev.yml exec backend bunx prisma db seed
```

**/!\\ ATTENTION /!\\** : après l'exécution de ces commandes, il est fortement conseillé de redémarrer le backend ou de reconstruire les images. Pour cela, exécuter la commande suivante

```bash
# Redémarrer le serveur backend
docker compose -f docker-compose.dev.yml restart backend
```

#### 3. Accéder au service

L'application sera accessible sur :

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3000
- **Meilisearch** : http://localhost:7700
- **PostgreSQL** : localhost:5432
- **Adminer** : http://localhost:8080

**Adminer** est disponible pour gérer facilement la base de données PostgreSQL via une interface web. Les informations de connexion sont les suivantes :

- **Système** : PostgreSQL
- **Serveur** : `postgresql`
- **Utilisateur** : `dev_user`
- **Mot de passe** : `devpassword`
- **Base de données** : `ataccoteque_dev`

---

### Production

En production, des variables d'environnement contenant entre autres des mots de passe doivent être positionnées. Pour cela, exécuter la commande suivante pour créer le fichier `.env` qui les contiendra et modifier les valeurs associées par défaut.

```bash
# Créer le fichier .env
cp .env.example .env
```

Pour lancer les services exécuter la commande suivante.

```bash
# Lancer en production
docker compose up -d

# Avec reconstruction des images
docker compose up -d --build
```

L'application est accessible à l'adresse suivante : http://localhost:8099

---

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

# Arrêter et supprimer les volumes (⚠️ supprime la DB !)
docker compose down -v

# Redémarrer un service spécifique
docker compose restart backend

# Accéder au shell d'un container
docker compose exec backend sh
docker compose exec postgres psql -U ataccoteque_user -d ataccoteque_dev

# Voir l'état des services
docker compose ps
```

---

### Structure Docker

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

## Lors du développement

### Auto-complétion et erreurs IDE

Afin que votre IDE de choix parvienne à faire de l'auto-complétion et l'affichage des erreurs partout, les dépendances du projet doivent aussi être installées en local pour être reconnues par celui-ci. Pour cela, exécuter la commande suivante à la racine du répertoire `app/server` et `app/client` :

```bash
# Installer les dépendances localement
bun install
```

### Utilisation de Prisma

Afin d'utiliser Prisma, référez-vous à la documentation officielle. Cependant, voici quelques bases importantes.

#### Migration

Les tables de la base de données sont construites par _Prisma_ lors de l'opération de migration grâce au schéma défini dans le fichier `app/server/prisma/schema.prisma`. Les migrations sont définies dans le dossier `migrations` à l'intérieur du dossier `prisma`. Ce dossier comprend un historique de toutes les migrations qui ont été effectuées. Pour ajouter une migration lorsque vous avez modifié un schéma Prisma, exécuter la commande suivante :

```bash
# Exemple de commande pour effectuer une migration nommée
docker compose -f docker-compose.dev.yml exec backend bunx prisma migrate dev --name <nom_changement>
```

En remplaçant `<nom_changement>` par une description de votre changement (à la manière d'un commit). Par exemple:

```bash
# Exemple de commande pour effectuer une migration nommée
docker compose -f docker-compose.dev.yml exec backend bunx prisma migrate dev --name user_add_username_field
```

Une fois ce changement effectué, régénérer le client à l'aide des commandes définies auparavant.

#### Seeding

Le fichier `app/server/prisma/seed.ts` est le script utilisé pour peupler la base de données, vous pouvez le modifier pour que la base de données soit remplie de valeurs par défaut lors du démarrage de la base de données de production. **Attention**, ce script est exécuté à chaque démarrage de serveur donc vérifiez bien que les informations sont déjà présentes. Afin de tester ce script, exécuter la commande définie auparavant.

## Développement en équipe

### 1. Créer une issue

Avant de commencer à travailler sur une fonctionnalité ou un bug, **créez toujours une issue** sur GitHub décrivant le problème ou la fonctionnalité

### 2. Créer une branche liée à l'issue

**Chaque fonctionnalité ou correction doit avoir sa propre branche.**

Nomenclature des branches :

- `feat/description` pour une nouvelle fonctionnalité
- `fix/description` pour une correction de bug
- `docs/description` pour la documentation
- `refactor/description` pour du refactoring

Exemple :

```bash
# Pour l'issue #42 : Ajout de la recherche d'annales
git checkout -b feat/recherche-annales

# Pour l'issue #58 : Correction du bug de connexion
git checkout -b fix/bug-connexion
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
