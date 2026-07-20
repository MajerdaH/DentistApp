# 🦷 Cabinet Dentaire - Application de Gestion

Application web complète pour la gestion d'un cabinet dentaire avec support hors-ligne.

## Fonctionnalités

### 👥 Gestion des Patients
- Créer, modifier, supprimer des patients
- Informations personnelles et médicales
- Migration rapide depuis documents papier
- Upload de documents (PDF, images)

### 📅 Gestion des Rendez-vous
- Calendrier interactif (vue semaine/mois)
- Création de rendez-vous avec durée personnalisée
- Gestion des statuts (planifié, terminé, annulé, absent)
- Blocage pour vacances/absences

### 🦷 Dossier Médical (Dentiste uniquement)
- Historique des soins
- Schéma dentaire interactif (adulte/enfant)
- Suivi des coûts et paiements
- Notes cliniques

### 👤 Gestion des Rôles
- **Dentiste**: Accès complet
- **Secrétaire**: Accès limité (pas de données médicales)

### 💾 Sauvegarde
- Export manuel (ZIP)
- Sauvegarde automatique quotidienne par email
- Historique des sauvegardes

## Installation

### Prérequis
- Node.js 18+
- npm ou yarn

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Identifiants par défaut

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Dentiste | dentiste@cabinet.com | admin123 |
| Secrétaire | secretaire@cabinet.com | admin123 |

⚠️ **Changez ces mots de passe après la première connexion!**

## Configuration

### Backend (.env)
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="votre-secret-jwt"
PORT=3001

# Email (optionnel - pour rappels et sauvegardes)
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT=587
SMTP_USER="votre-email"
SMTP_PASS="votre-mot-de-passe"
BACKUP_EMAIL="email-pour-sauvegardes@example.com"
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

## Déploiement

### Option 1: Vercel + Supabase (Gratuit)
1. Créez un projet Supabase
2. Déployez le frontend sur Vercel
3. Configurez les variables d'environnement

### Option 2: Self-hosted
1. Installez Node.js sur votre serveur
2. Clonez le projet
3. Configurez nginx comme reverse proxy
4. Utilisez PM2 pour le backend

## Structure du projet

```
DentistApp/
├── backend/
│   ├── src/
│   │   ├── routes/          # Routes API
│   │   ├── middleware/      # Auth, upload
│   │   ├── services/        # Email, backup
│   │   └── index.js         # Point d'entrée
│   ├── prisma/
│   │   ├── schema.prisma    # Schéma DB
│   │   └── seed.js          # Données initiales
│   └── uploads/             # Fichiers uploadés
├── frontend/
│   ├── src/
│   │   ├── components/      # Composants React
│   │   ├── pages/           # Pages
│   │   ├── services/        # API calls
│   │   ├── contexts/        # Auth, Toast
│   │   └── types/           # TypeScript types
│   └── public/
└── README.md
```

## API Endpoints

### Auth
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Utilisateur courant
- `PUT /api/auth/change-password` - Changer mot de passe

### Patients
- `GET /api/patients` - Liste des patients
- `POST /api/patients` - Créer un patient
- `GET /api/patients/:id` - Détails patient
- `PUT /api/patients/:id` - Modifier patient
- `DELETE /api/patients/:id` - Supprimer patient

### Rendez-vous
- `GET /api/appointments` - Liste des RDV
- `POST /api/appointments` - Créer un RDV
- `PUT /api/appointments/:id` - Modifier un RDV
- `DELETE /api/appointments/:id` - Supprimer un RDV

### Documents
- `GET /api/documents/patient/:id` - Documents d'un patient
- `POST /api/documents/patient/:id` - Upload document
- `DELETE /api/documents/:id` - Supprimer document

## Licence

MIT
