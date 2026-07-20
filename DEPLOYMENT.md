# 🚀 Guide de Déploiement Gratuit

## Option 1: Railway (Le Plus Simple) ⭐ RECOMMANDÉ

Railway permet de déployer le backend + la base de données gratuitement.

### Étapes:

1. **Créer un compte**: https://railway.app (connexion avec GitHub)

2. **Déployer le Backend**:
   - Cliquez "New Project" → "Deploy from GitHub repo"
   - Sélectionnez votre repo
   - Railway détecte automatiquement Node.js
   - Ajoutez les variables d'environnement:
     ```
     DATABASE_URL=file:./prod.db
     JWT_SECRET=votre-secret-super-securise-pour-production
     NODE_ENV=production
     PORT=3001
     ```

3. **Déployer le Frontend sur Netlify**:
   - Allez sur https://netlify.com
   - "Add new site" → "Import an existing project"
   - Connectez GitHub, sélectionnez le repo
   - Build command: `cd frontend && npm install && npm run build`
   - Publish directory: `frontend/dist`
   - Ajoutez la variable: `VITE_API_URL=https://votre-backend.railway.app/api`

### Limites gratuites Railway:
- 500 heures/mois d'exécution
- 100 GB de bande passante
- Suffisant pour un petit cabinet!

---

## Option 2: Render (Alternative Simple)

### Backend sur Render:

1. Créez un compte: https://render.com

2. "New" → "Web Service"
   - Connectez votre repo GitHub
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate && npx prisma db push`
   - Start Command: `node src/index.js`

3. Variables d'environnement:
   ```
   DATABASE_URL=file:./prod.db
   JWT_SECRET=votre-secret-production
   NODE_ENV=production
   ```

### Frontend sur Render:
1. "New" → "Static Site"
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

### Limites gratuites Render:
- Le service "dort" après 15 min d'inactivité (redémarre en ~30 sec)
- 750 heures/mois

---

## Option 3: Vercel + Supabase (Plus Robuste)

Meilleur pour une utilisation intensive, mais plus complexe à configurer.

### Étapes:

1. **Créer un projet Supabase** (https://supabase.com):
   - Nouveau projet → Copiez l'URL de la base de données PostgreSQL
   - Modifiez `prisma/schema.prisma`:
     ```prisma
     datasource db {
       provider = "postgresql"
       url      = env("DATABASE_URL")
     }
     ```

2. **Déployer le backend sur Vercel**:
   - Installez Vercel CLI: `npm i -g vercel`
   - Dans le dossier backend: `vercel`
   - Configurez DATABASE_URL avec l'URL Supabase

3. **Déployer le frontend sur Vercel**:
   - Dans le dossier frontend: `vercel`
   - Configurez VITE_API_URL

---

## 🔐 Conseils de Sécurité pour la Production

1. **Changez le JWT_SECRET** - utilisez une chaîne longue et aléatoire
2. **Changez les mots de passe par défaut** immédiatement
3. **Activez HTTPS** (automatique sur Railway/Render/Vercel)
4. **Configurez les emails** pour les rappels et sauvegardes

---

## 📝 Après le Déploiement

1. Accédez à votre URL
2. Connectez-vous avec: `dentiste@cabinet.com` / `admin123`
3. Allez dans Paramètres → Changez le mot de passe
4. Configurez les informations du cabinet

---

## Besoin d'aide?

- Railway docs: https://docs.railway.app
- Render docs: https://render.com/docs
- Vercel docs: https://vercel.com/docs

