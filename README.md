# Système d'Information Judiciaire du Niger (e-Justice Niger)

Monorepo contenant :
- **Backend** (racine) : API Express + TypeScript + Sequelize (PostgreSQL) — version `2.2.0`
- **Mobile** (`justice_mobile/`) : application Expo / React Native

---

## Table des matières

1. [Développement local](#1-développement-local)
2. [Déploiement backend sur Render](#2-déploiement-backend-sur-render)
3. [Déploiement mobile avec EAS Build](#3-déploiement-mobile-avec-eas-build)
4. [Variables d'environnement](#4-variables-denvironnement)
5. [Sécurité](#5-sécurité)

---

## 1. Développement local

### Prérequis
- Node.js >= 18
- PostgreSQL installé localement
- npm

### Backend

```bash
# Installer les dépendances
npm install

# Copier et remplir les variables d'environnement
cp .env.example .env

# Lancer en développement (rechargement automatique)
npm run dev
```

L'API est disponible sur `http://localhost:4000`.

### Mobile

```bash
cd justice_mobile

# Installer les dépendances
npm install

# Copier et adapter l'IP de ta machine
cp .env.example .env
# Modifier EXPO_PUBLIC_LOCAL_IP et EXPO_PUBLIC_API_URL avec ton IP locale

# Lancer Expo
npm run dev
```

Scanner le QR code avec l'application **Expo Go** sur le téléphone.

### Scripts backend disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur en développement (tsx watch) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Démarre le serveur compilé |
| `npm run seed` | Peuple la base de données |
| `npm run lint` | Lint TypeScript |

---

## 2. Déploiement backend sur Render

### Étape 1 — Pousser le code sur GitHub

```bash
git remote add origin https://github.com/TON_USERNAME/TON_REPO.git
git push -u origin main
```

### Étape 2 — Créer la base de données PostgreSQL sur Render

1. Aller sur [render.com](https://render.com) → **New** → **PostgreSQL**
2. Choisir un nom (ex: `justice-db`), région, plan Free
3. Cliquer **Create Database**
4. Copier la valeur **Internal Database URL** (format `postgresql://user:pass@host/db`)

### Étape 3 — Créer le Web Service backend

1. Sur Render → **New** → **Web Service**
2. Connecter ton repo GitHub
3. Configurer :

| Champ | Valeur |
|-------|--------|
| **Name** | `e-justice-niger-api` |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | Free (ou payant si trafic) |

4. Dans **Environment Variables**, ajouter :

| Variable | Valeur |
|----------|--------|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `DB_HOST` | (depuis Internal Database URL de Render) |
| `DB_PORT` | `5432` |
| `DB_NAME` | (nom de ta DB Render) |
| `DB_USER` | (user de ta DB Render) |
| `DB_PASSWORD` | (mot de passe de ta DB Render) |
| `DB_SSL` | `true` |
| `JWT_SECRET` | (générer avec `openssl rand -hex 64`) |
| `REFRESH_SECRET` | (générer avec `openssl rand -hex 64`) |
| `JWT_EXPIRES_IN` | `7d` |
| `REFRESH_EXPIRES_IN` | `30d` |
| `BCRYPT_ROUNDS` | `10` |
| `CORS_ORIGIN` | `*` |
| `UPLOAD_PATH` | `./uploads` |
| `MAX_FILE_SIZE` | `10485760` |

5. Cliquer **Create Web Service**

Render build automatiquement à chaque `git push` sur `main`.

L'URL publique de l'API sera du type : `https://e-justice-niger-api.onrender.com`

> **Note** : Sur le plan Free de Render, le serveur se met en veille après 15 min d'inactivité. Le premier appel après la veille prend ~30 secondes.

---

## 3. Déploiement mobile avec EAS Build

### Prérequis

```bash
# Installer EAS CLI globalement
npm install -g eas-cli

# Se connecter à Expo
eas login
```

### Étape 1 — Mettre à jour l'URL de l'API en production

Dans `justice_mobile/.env`, changer `EXPO_PUBLIC_API_URL` pour pointer vers ton backend Render :

```env
EXPO_PUBLIC_API_URL=https://e-justice-niger-api.onrender.com/api
```

### Étape 2 — Build APK (Android, pour test interne)

```bash
cd justice_mobile
eas build --profile preview --platform android
```

Cela génère un fichier `.apk` téléchargeable et installable directement sur Android.

### Étape 3 — Build de production (Play Store)

```bash
eas build --profile production --platform android
```

Pour soumettre directement au Play Store :

```bash
eas submit --platform android
```

### Profils de build disponibles (`eas.json`)

| Profil | Usage | Format |
|--------|-------|--------|
| `development` | Test avec Expo Dev Client | Distribution interne |
| `preview` | Test APK sur appareils réels | `.apk` Android |
| `production` | Soumission app stores | `.aab` Android / `.ipa` iOS |

---

## 4. Variables d'environnement

### Backend (`.env` — copier depuis `.env.example`)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DB_HOST` | Hôte PostgreSQL | `localhost` |
| `DB_PORT` | Port PostgreSQL | `5432` |
| `DB_NAME` | Nom de la base | `justice_db` |
| `DB_USER` | Utilisateur PostgreSQL | `postgres` |
| `DB_PASSWORD` | Mot de passe PostgreSQL | — |
| `DB_SSL` | SSL requis (Render = `true`) | `false` |
| `DB_ALTER` | Alter schema auto (dev only) | `true` |
| `JWT_SECRET` | Secret pour les tokens JWT | (hex 64 bytes) |
| `REFRESH_SECRET` | Secret pour les refresh tokens | (hex 64 bytes) |
| `JWT_EXPIRES_IN` | Durée de vie du JWT | `7d` |
| `REFRESH_EXPIRES_IN` | Durée de vie du refresh | `30d` |
| `PORT` | Port du serveur | `4000` |
| `NODE_ENV` | Environnement | `development` |
| `CORS_ORIGIN` | Origines autorisées CORS | `*` |
| `UPLOAD_PATH` | Dossier uploads | `./uploads` |
| `MAX_FILE_SIZE` | Taille max upload (bytes) | `10485760` (10 MB) |

### Mobile (`justice_mobile/.env` — copier depuis `justice_mobile/.env.example`)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `EXPO_PUBLIC_LOCAL_IP` | IP locale de la machine de dev | `192.168.1.x` |
| `EXPO_PUBLIC_API_URL` | URL de l'API backend | `http://192.168.1.x:4000/api` |
| `EXPO_PUBLIC_TIMEOUT` | Timeout des requêtes (ms) | `30000` |
| `APP_VERSION` | Version de l'app | `2.2.0` |

---

## 5. Sécurité

- Les fichiers `.env` ne doivent **jamais** être commités — ils sont dans `.gitignore`.
- Utiliser `.env.example` comme modèle (sans vraies valeurs).
- Générer des secrets forts pour la production :
  ```bash
  openssl rand -hex 64
  ```
- En production, mettre `DB_ALTER=false` et `DB_LOGGING=false` pour éviter les modifications automatiques de schéma.
- Le rate limiting est configuré à 100 requêtes / 15 min par IP.
