# ATACCothèque

## Stack technique

### Frontend

Utilisation de la bibliothèque **React** pour l'interface utilisateur web avec l'outil de construction **Vite**. _React_ utilise le langage **TypeScript** pour une programmation typée.

Le projet utilise également les bibliothèques suivantes avec _React_ :

- **shadcn/ui** pour des composants de base qui respectent les règles d'accessibilité (basé sur _Radix UI_)
- **Tailwind CSS** car elle est une dépendance de _shadcn/ui_ et permet de garder une interface unifiée

### Backend

Utilisation de l'environnement d'exécution **Node.js** avec le framework **Express.js** qui utilise le langage **TypeScript** pour conserver les avantages d'un langage typé.

Le projet utilise également les bibliothèques suivantes avec _Node.js_ :

- **jsonwebtoken** pour l'authentification des utilisateurs lors des appels API

### Meilisearch

Moteur de recherche open source pour l'indexation des annales afin d'avoir une barre de recherche rapide et résiliente aux fautes de frappe.

### MySQL

Base de données utilisée par le projet.

### Nginx

Serveur proxy utilisé en entrée de ce projet pour gérer les routes.

Les routes suivantes sont disponibles :

- `/` pour le _frontend_
- `/api/` pour le _backend_ (API)
- `/file/` pour l'accès aux annales
