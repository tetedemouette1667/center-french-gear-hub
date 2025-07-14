#!/bin/bash

# Script de déploiement automatique pour Center French Gear Hub
# Usage: ./deploy.sh [GitHub repo URL]

set -e

echo "🚀 Center French Gear Hub - Déploiement automatique"
echo "=================================================="

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier les prérequis
check_requirements() {
    log_info "Vérification des prérequis..."
    
    if ! command -v git &> /dev/null; then
        log_error "Git n'est pas installé"
        exit 1
    fi
    
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 n'est pas installé"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé"
        exit 1
    fi
    
    log_success "Prérequis vérifiés"
}

# Tester l'application
test_application() {
    log_info "Test de l'application..."
    
    if python3 test_deployment.py; then
        log_success "Tous les tests passés"
    else
        log_error "Tests échoués - Déploiement interrompu"
        exit 1
    fi
}

# Préparer le repository Git
prepare_git() {
    log_info "Préparation du repository Git..."
    
    # Initialiser Git si nécessaire
    if [ ! -d ".git" ]; then
        git init
        log_success "Repository Git initialisé"
    fi
    
    # Ajouter tous les fichiers
    git add .
    
    # Vérifier s'il y a des changements
    if git diff --staged --quiet; then
        log_warning "Aucun changement détecté"
    else
        # Commit des changements
        commit_message="🚀 Deploy Center French Gear Hub - $(date +'%Y-%m-%d %H:%M:%S')"
        git commit -m "$commit_message"
        log_success "Changements commitées"
    fi
}

# Configurer le repository remote
setup_remote() {
    local repo_url="$1"
    
    if [ -z "$repo_url" ]; then
        log_warning "URL du repository GitHub non fournie"
        log_info "Créez un repository sur GitHub et relancez avec:"
        log_info "./deploy.sh https://github.com/votre-username/center-french-gear-hub.git"
        return 1
    fi
    
    log_info "Configuration du repository remote..."
    
    # Supprimer l'origine existante si elle existe
    if git remote get-url origin &> /dev/null; then
        git remote remove origin
    fi
    
    # Ajouter la nouvelle origine
    git remote add origin "$repo_url"
    git branch -M main
    
    log_success "Repository remote configuré: $repo_url"
}

# Pousser vers GitHub
push_to_github() {
    log_info "Push vers GitHub..."
    
    if git push -u origin main; then
        log_success "Code poussé vers GitHub"
    else
        log_error "Échec du push vers GitHub"
        log_info "Vérifiez vos permissions et l'URL du repository"
        exit 1
    fi
}

# Générer les instructions Vercel
generate_vercel_instructions() {
    log_info "Génération des instructions Vercel..."
    
    cat << EOF > VERCEL_SETUP.md
# Instructions de Déploiement Vercel

## 1. Connecter à Vercel
1. Allez sur https://vercel.com
2. Connectez-vous avec votre compte GitHub
3. Cliquez sur "New Project"
4. Importez votre repository GitHub

## 2. Variables d'environnement
Dans Vercel → Settings → Environment Variables, ajoutez:

\`\`\`
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/roblox_gear_hub
REACT_APP_BACKEND_URL=https://your-app-name.vercel.app
JWT_SECRET=your-super-secret-jwt-key-change-this
\`\`\`

## 3. MongoDB Atlas
1. Créez un cluster sur https://cloud.mongodb.com
2. Configurez l'accès réseau (0.0.0.0/0)
3. Créez un utilisateur de base de données
4. Copiez la connection string dans MONGO_URL

## 4. Déploiement
- Vercel déploiera automatiquement à chaque push
- Première connexion: root / Mouse123890!
- Changez le mot de passe admin après déploiement

## 5. Test
Testez votre déploiement avec:
\`\`\`bash
python3 test_deployment.py vercel
\`\`\`

🎉 Votre Center French Gear Hub est maintenant en ligne !
EOF

    log_success "Instructions Vercel générées dans VERCEL_SETUP.md"
}

# Afficher le résumé
show_summary() {
    log_info "Résumé du déploiement"
    echo "===================="
    echo "📁 Repository: $(git remote get-url origin 2>/dev/null || echo 'Non configuré')"
    echo "🌐 Prochaine étape: Déploiement Vercel"
    echo "📖 Instructions: VERCEL_SETUP.md"
    echo ""
    log_success "Déploiement préparé avec succès !"
    echo ""
    log_warning "Prochaines étapes:"
    echo "1. Configurez MongoDB Atlas"
    echo "2. Déployez sur Vercel"
    echo "3. Configurez les variables d'environnement"
    echo "4. Testez le déploiement"
}

# Fonction principale
main() {
    local repo_url="$1"
    
    check_requirements
    test_application
    prepare_git
    
    if setup_remote "$repo_url"; then
        push_to_github
    fi
    
    generate_vercel_instructions
    show_summary
}

# Exécuter le script
main "$@"