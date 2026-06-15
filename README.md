# Système d'Information Judiciaire du Niger (e-Justice Niger)

Monorepo contenant :
- **Backend** (racine) : API Express + TypeScript + Sequelize (PostgreSQL)
- **Mobile** (`justice_mobile/`) : application Expo / React Native

## Prérequis

- Node.js (>= 18)
- PostgreSQL
- npm

## Installation — Backend

1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Copier `.env.example` vers `.env` et renseigner les valeurs (base de données, secrets JWT, etc.) :
   ```bash
   cp .env.example .env
   ```
3. Lancer en développement :
   ```bash
   npm run dev
   ```
4. Build de production :
   ```bash
   npm run build
   npm start
   ```

### Scripts disponibles
- `npm run dev` — démarre le serveur en mode développement (tsx watch)
- `npm run build` — compile TypeScript vers `dist/`
- `npm start` — démarre le serveur compilé (`dist/server.js`)
- `npm run seed` — exécute le seeder de la base de données
- `npm run lint` — lint du code TypeScript

## Installation — Mobile (`justice_mobile/`)

1. Installer les dépendances :
   ```bash
   cd justice_mobile
   npm install
   ```
2. Copier `.env.example` vers `.env` et adapter l'IP locale / URL de l'API :
   ```bash
   cp .env.example .env
   ```
3. Lancer l'application :
   ```bash
   npm run dev
   ```

## Sécurité

- Les fichiers `.env` ne doivent **jamais** être commités. Utiliser `.env.example` comme modèle.
- Régénérer les secrets (`JWT_SECRET`, `REFRESH_SECRET`, mot de passe PostgreSQL) si le dépôt a déjà été partagé ou poussé sur un remote.
