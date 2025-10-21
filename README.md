# ActiveSkils

ActiveSkils est une plateforme d'analyse et de gestion de compétences professionnelles qui utilise l'intelligence artificielle pour extraire et structurer les informations à partir de documents PDF (CV, lettres de motivation, etc.).

## 🏗️ Architecture

### Vue d'ensemble
Le projet suit une architecture full-stack moderne avec :
- **Frontend** : React + TypeScript + Vite + Tailwind CSS
- **Backend** : Node.js + Express + TypeScript
- **Base de données** : Supabase (PostgreSQL)

### Structure du projet
```
ActiveSkils/
├── client/                 # Application React frontend
├── server/                 # API Express backend
├── package.json           # Configuration monorepo
└── README.md              # Documentation
```

## 📁 Structure détaillée

### Client (`/client`)

#### Pages principales
- **`/`** - Page d'accueil (redirige vers dashboard si connecté)
- **`/auth`** - Authentification (login/signup)
- **`/app`** - Dashboard principal
- **`/documents`** - Gestion des documents
- **`/portfolio`** - Portfolio de compétences
- **`/profile`** - Profil utilisateur

#### Composants clés
- **`AuthContext`** - Gestion de l'authentification et du profil utilisateur
- **`Navbar`** - Navigation principale
- **`extracted-data/`** - Composants d'affichage des données extraites :
  - `IndividualData.tsx` - Données personnelles
  - `Formation.tsx` - Formations et diplômes
  - `ParcoursPro.tsx` - Parcours professionnel
  - `AutresExp.tsx` - Autres expériences
  - `Realisations.tsx` - Réalisations
  - `Analysis.tsx` - Analyse globale

#### Configuration
- **`components.json`** - Configuration Shadcn/UI
- **`tailwind.config.ts`** - Configuration Tailwind
- **`vite.config.ts`** - Configuration Vite

### Server (`/server`)

#### Contrôleurs
- **`extract-pdf.controller.ts`** - Extraction OCR des PDF
- **`extract-individual-data.controller.ts`** - Extraction données personnelles
- **`extract-formations.controller.ts`** - Extraction formations
- **`extract-parcoursPro.controller.ts`** - Extraction parcours professionnel
- **`extract-autresExperience.controller.ts`** - Extraction autres expériences
- **`extract-realisations.controller.ts`** - Extraction réalisations
- **`openAi-assistant.controller.ts`** - Assistant IA pour analyse globale
- **`retrievePromptsResult.controller.ts`** - Récupération des résultats

#### Middleware
- **`extractionControllerFactory.ts`** - Factory pour orchestrer les extractions

#### Repositories
- **`documents.repository.ts`** - Gestion des documents
- **`profiles.repository.ts`** - Gestion des profils utilisateur
- **`prompts.repository.ts`** - Gestion des prompts IA

#### Configuration
- **`routes.ts`** - Définition des routes API
- **`index.ts`** - Point d'entrée du serveur

## 🗄️ Base de données

### Tables principales

#### `profiles`
Stocke les profils utilisateur et les données extraites

#### `documents`
Gère les documents uploadés

#### `prompts`
Centralise la gestion des prompts IA

## 🔌 API Routes

### Endpoints principaux

#### GET
- **`/api/prompt-results/:userId`** - Récupère les résultats d'extraction pour un utilisateur

#### POST
- **`/api/extract/pdf-data`** - Lance l'extraction OCR d'un PDF
- **`/api/launch-extraction`** - Lance une extraction spécifique (données personnelles, formations, etc.)

### Processus d'extraction

1. **Upload PDF** → Extraction OCR → Markdown
2. **Extraction données personnelles** → JSON structuré
3. **Extraction formations** → JSON structuré
4. **Extraction parcours professionnel** → JSON structuré
5. **Extraction autres expériences** → JSON structuré
6. **Extraction réalisations** → JSON structuré
7. **Analyse globale** → Résumé par l'assistant IA

## 🤖 Intelligence Artificielle

### Prompts spécialisés
Chaque type d'extraction utilise un prompt spécialisé stocké en base :

- **`extract-individual-data`** - Extraction des informations personnelles
- **`extract-formations`** - Extraction des formations et diplômes
- **`extract-parcours-professionnel`** - Extraction du parcours professionnel
- **`extract-autres-experiences`** - Extraction des expériences bénévoles/associatives
- **`extract-realisations`** - Extraction des réalisations et accomplissements

### Assistant IA
Un assistant OpenAI analyse l'ensemble des données extraites pour fournir une synthèse personnalisée des compétences.

## 🚀 Installation et développement


### Installation
```bash
# Cloner le repository
git clone https://github.com/AndrewFJTECHLAB/ActiveSkils.git
cd ActiveSkils

# Installer les dépendances
npm install

# Installer les dépendances client et serveur
cd client && npm install
cd ../server && npm install
cd ..
```

### Configuration
1. Créer un fichier `.env.dev` dans le dossier `server/`
2. Configurer les variables d'environnement :
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# OCR Service
FJSOFTLAB_OCR_API_KEY=your_ocr_api_key

# Frontend URL
FRONTEND_ULR=http://localhost:8080
```

### Développement
```bash
# Démarrer en mode développement (client + serveur)
npm run start:dev

# Ou démarrer séparément
npm run start:client  # Port 8080
npm run start:server  # Port 3000
```

### Build production
```bash
# Client
cd client && npm run build

# Serveur
cd server && npm run build
```

## 🔧 Scripts disponibles

### Root
- `npm run start:client` - Démarre le client en dev
- `npm run start:server` - Démarre le serveur en dev
- `npm run start:dev` - Démarre client et serveur en parallèle

### Client
- `npm run dev` - Serveur de développement Vite
- `npm run build` - Build de production
- `npm run preview` - Prévisualisation du build
- `npm run lint` - Linting ESLint

### Serveur
- `npm run dev` - Serveur de développement avec hot reload
- `npm run build` - Compilation TypeScript
- `npm run start` - Démarrage en production

## 🎨 Interface utilisateur

### Design System
- **Tailwind CSS** pour le styling
- **Radix UI** pour les composants accessibles
- **Shadcn/UI** pour la cohérence visuelle
- **Lucide React** pour les icônes

### Thème
- Support du mode sombre/clair
- Palette de couleurs cohérente
- Design responsive

## 🔒 Sécurité

### Authentification
- **Supabase Auth** pour la gestion des utilisateurs
- **JWT tokens** pour l'authentification
- **Row Level Security** pour la protection des données

### CORS
- Configuration restrictive des origines autorisées
- Support des environnements de développement et production

### Validation
- Validation côté client avec React Hook Form + Zod
- Validation côté serveur des données d'entrée

## 📊 Monitoring et logs

### Logs serveur
- Logs structurés pour le debugging
- Gestion des erreurs avec try/catch
- Monitoring des performances d'extraction

### Gestion d'erreurs
- Error boundaries React côté client
- Gestion centralisée des erreurs API
- Messages d'erreur utilisateur-friendly

## 🚀 Déploiement

### Frontend
- Build statique (npm run build)
- Déploiement sur Azure
- swa deploy ./dist --app-name activeskills-app --env default

### Backend
- Build d'une image Docker avec tag de version
- Déploiement sur Azure Container Registry
- Mise à jour du tag de version dans Azure pour déployer la nouvelle image

### Base de données
- Migrations Supabase pour les mises à jour de schéma
- Backup automatique via Supabase

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

**ActiveSkils** - Transformez vos documents en insights de compétences avec l'IA 🚀
