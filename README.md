# Center French - Gear Hub

Un site web professionnel pour la gestion des suggestions de gears Roblox pour le serveur "Center French".

## 🚀 Fonctionnalités

### 🎯 Gestion des Gears
- **4 catégories** : Joueurs, Modérateur, Événements, Interdits
- **Affichage détaillé** : Nom, surnom, ID, image, description
- **Recherche et tri** : Trouvez rapidement les gears
- **Copie d'ID** : Bouton pour copier l'ID des gears autorisés

### 🔐 Système d'Authentification
- **3 niveaux d'accès** :
  - **Modérateur** : Visualisation des suggestions
  - **Responsable** : Approbation/rejet des suggestions + gestion des gears
  - **Créateur** : Toutes les permissions + gestion des utilisateurs

### 💡 Système de Suggestions
- **Soumission publique** : Tous les utilisateurs peuvent proposer des gears
- **Validation hiérarchique** : Processus d'approbation par les responsables
- **Gestion complète** : Modification, suppression, changement de catégorie

### 🎨 Design Professionnel
- **Thème violet sombre** par défaut
- **Mode clair/sombre** avec basculement
- **Interface responsive** adaptée à tous les écrans
- **Animations fluides** et transitions professionnelles

## 🛠️ Technologies Utilisées

### Frontend
- **React 18** avec hooks modernes
- **CSS3** avec variables CSS et animations
- **Responsive design** mobile-first
- **Fetch API** pour les requêtes

### Backend
- **FastAPI** avec Python
- **MongoDB** pour la base de données
- **JWT** pour l'authentification
- **Bcrypt** pour le hachage des mots de passe
- **Motor** pour les opérations async MongoDB

## 🚀 Déploiement

### Déploiement automatique avec Vercel

1. **Préparer le repository GitHub** :
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Center French Gear Hub"
   git branch -M main
   git remote add origin https://github.com/votre-username/center-french-gear-hub.git
   git push -u origin main
   ```

2. **Déployer sur Vercel** :
   - Connectez-vous sur [vercel.com](https://vercel.com)
   - Cliquez sur "New Project"
   - Importez votre repository GitHub
   - Vercel détectera automatiquement la configuration

3. **Configuration des variables d'environnement** :
   Dans le dashboard Vercel, ajoutez :
   - `MONGO_URL` : URL de votre base MongoDB (MongoDB Atlas recommandé)
   - `REACT_APP_BACKEND_URL` : URL de votre app Vercel

### MongoDB Atlas Setup

1. Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Créez un cluster gratuit
3. Configurez l'accès réseau (0.0.0.0/0 pour Vercel)
4. Créez un utilisateur de base de données
5. Copiez la connection string dans `MONGO_URL`

## 👥 Utilisation

### Compte Administrateur
- **Username** : `root`
- **Password** : `Mouse123890!`
- **Rôle** : Créateur (toutes les permissions)

### Workflow
1. **Utilisateurs** font des suggestions via le formulaire public
2. **Modérateurs** peuvent consulter les suggestions
3. **Responsables** approuvent/rejettent et gèrent les gears
4. **Créateur** gère les utilisateurs et toutes les permissions

### Fonctionnalités Avancées
- **Modification des gears** : Changement de catégorie par les responsables/créateurs
- **Gestion des utilisateurs** : Création de comptes modérateurs et responsables
- **Statistiques** : Suivi des suggestions et gears par catégorie

## 📱 Interface

### Navigation
- **Gears** : Visualisation par catégorie avec recherche
- **Suggestions** : Soumission et gestion des propositions
- **Utilisateurs** : Gestion des comptes (créateurs uniquement)

### Responsive
- **Desktop** : Interface complète avec grille multi-colonnes
- **Tablet** : Adaptation avec colonnes réduites
- **Mobile** : Interface optimisée tactile

## 🎨 Personnalisation

### Thèmes
- **Violet sombre** (par défaut) : Thème gaming professionnel
- **Clair** : Alternative pour usage diurne
- **Basculement** : Bouton dans l'en-tête

### Couleurs
- **Primaire** : Purple (#8b5cf6)
- **Secondaire** : Blue, Orange, Red pour les catégories
- **Accents** : Gradients professionnels

## 🔒 Sécurité

- **JWT** avec expiration 24h
- **Hachage bcrypt** pour les mots de passe
- **Validation** des permissions par endpoint
- **Sanitization** des entrées utilisateur

## 🐛 Support

Pour toute question ou problème :
1. Vérifiez la console développeur
2. Consultez les logs Vercel
3. Vérifiez la connexion MongoDB

## 📄 Licence

Ce projet est destiné à un usage privé pour le serveur "Center French".

---

**Développé avec ❤️ pour la communauté Center French**