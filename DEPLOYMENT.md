# Guide de Déploiement - Center French Gear Hub

## 🚀 Déploiement sur Vercel + GitHub

### Étape 1 : Préparation du Repository GitHub

1. **Créer un nouveau repository sur GitHub** :
   - Allez sur [github.com](https://github.com)
   - Cliquez sur "New repository"
   - Nom : `center-french-gear-hub`
   - Description : "Site de gestion des gears Roblox pour Center French"
   - Définissez comme Public ou Private selon vos préférences

2. **Initialiser et pousser le code** :
   ```bash
   # Dans le dossier de votre projet
   git init
   git add .
   git commit -m "🚀 Initial commit - Center French Gear Hub"
   git branch -M main
   git remote add origin https://github.com/VOTRE-USERNAME/center-french-gear-hub.git
   git push -u origin main
   ```

### Étape 2 : Configuration MongoDB Atlas

1. **Créer un compte MongoDB Atlas** :
   - Allez sur [mongodb.com/atlas](https://www.mongodb.com/atlas)
   - Créez un compte gratuit
   - Créez un nouveau cluster (M0 gratuit)

2. **Configuration de sécurité** :
   - Dans "Network Access", ajoutez `0.0.0.0/0` (accès depuis partout)
   - Dans "Database Access", créez un utilisateur avec les permissions read/write

3. **Obtenir la connection string** :
   - Cliquez sur "Connect" → "Connect your application"
   - Copiez la connection string (format : `mongodb+srv://username:password@cluster.mongodb.net/database`)

### Étape 3 : Déploiement sur Vercel

1. **Connecter Vercel à GitHub** :
   - Allez sur [vercel.com](https://vercel.com)
   - Connectez-vous avec votre compte GitHub
   - Cliquez sur "New Project"
   - Importez votre repository `center-french-gear-hub`

2. **Configuration automatique** :
   - Vercel détectera automatiquement la configuration grâce au `vercel.json`
   - Le build se lancera automatiquement

3. **Configurer les variables d'environnement** :
   Dans le dashboard Vercel → Settings → Environment Variables :
   
   ```
   MONGO_URL = mongodb+srv://username:password@cluster.mongodb.net/roblox_gear_hub
   REACT_APP_BACKEND_URL = https://votre-app-name.vercel.app
   ```

### Étape 4 : Post-Déploiement

1. **Tester le déploiement** :
   - Visitez l'URL fournie par Vercel
   - Testez la connexion avec `root` / `Mouse123890!`
   - Vérifiez que les gears s'affichent correctement

2. **Initialiser la base de données** :
   Le script d'initialisation s'exécute automatiquement au premier démarrage.

### Étape 5 : Maintenance

1. **Mises à jour** :
   ```bash
   git add .
   git commit -m "🔄 Mise à jour des fonctionnalités"
   git push
   ```
   Vercel redéploiera automatiquement.

2. **Surveillance** :
   - Consultez les logs dans le dashboard Vercel
   - Surveillez l'utilisation de MongoDB Atlas

## 🔧 Configuration Avancée

### Domaine Personnalisé

1. Dans Vercel → Settings → Domains
2. Ajoutez votre domaine personnalisé
3. Configurez les DNS selon les instructions

### Variables d'Environnement Supplémentaires

```bash
# Optionnel : Clé secrète JWT personnalisée
JWT_SECRET=votre-cle-secrete-super-forte

# Optionnel : Configuration MongoDB
MONGODB_DB_NAME=roblox_gear_hub
```

### Backup de la Base de Données

1. **Backup automatique** : MongoDB Atlas fait des backups automatiques
2. **Backup manuel** : Utilisez MongoDB Compass ou mongodump

## 🐛 Résolution des Problèmes

### Problème : "Module not found"
- **Solution** : Vérifiez les dépendances dans `requirements.txt` et `package.json`

### Problème : "Database connection failed"
- **Solution** : Vérifiez la connection string MongoDB et les accès réseau

### Problème : "API routes not working"
- **Solution** : Vérifiez que les routes commencent par `/api/`

### Problème : "Frontend not loading"
- **Solution** : Vérifiez `REACT_APP_BACKEND_URL` dans les variables d'environnement

## 📊 Monitoring

### Vercel Analytics
- Activez les analytics dans le dashboard Vercel
- Consultez les performances et l'utilisation

### MongoDB Monitoring
- Surveillez les métriques dans MongoDB Atlas
- Configurez des alertes pour l'utilisation

## 🔐 Sécurité

### Recommendations
1. **Utilisez HTTPS** (automatique avec Vercel)
2. **Changez le mot de passe admin** après déploiement
3. **Configurez des IP whitelists** pour MongoDB si possible
4. **Activez 2FA** sur vos comptes GitHub, Vercel, et MongoDB

### Backup des Données
1. **Exportez régulièrement** vos données importantes
2. **Testez la restauration** périodiquement
3. **Documentez les procédures** de récupération

---

**✅ Votre site sera accessible à l'adresse fournie par Vercel !**

**🎮 Votre communauté Center French peut maintenant utiliser le Gear Hub !**