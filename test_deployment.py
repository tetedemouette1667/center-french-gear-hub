#!/usr/bin/env python3
"""
Script de test local avant déploiement
Teste toutes les fonctionnalités principales
"""
import requests
import json
import sys
import time
from datetime import datetime

# Configuration locale
LOCAL_BACKEND_URL = "http://localhost:8001/api"
VERCEL_BACKEND_URL = "https://your-app-name.vercel.app/api"

# Utiliser l'URL locale par défaut
BACKEND_URL = LOCAL_BACKEND_URL

# Identifiants de test
ROOT_USERNAME = "root"
ROOT_PASSWORD = "Mouse123890!"

class TestSuite:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.token = None
        
    def log(self, message, success=True):
        status = "✅" if success else "❌"
        print(f"{status} {message}")
        if success:
            self.passed += 1
        else:
            self.failed += 1
    
    def test_connection(self):
        """Test la connexion à l'API"""
        try:
            response = requests.get(f"{BACKEND_URL}/gears", timeout=10)
            if response.status_code == 200:
                self.log("Connexion à l'API réussie")
                return True
            else:
                self.log(f"Erreur de connexion: {response.status_code}", False)
                return False
        except Exception as e:
            self.log(f"Erreur de connexion: {e}", False)
            return False
    
    def test_authentication(self):
        """Test l'authentification"""
        try:
            login_data = {
                "username": ROOT_USERNAME,
                "password": ROOT_PASSWORD
            }
            response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                role = data.get("role")
                
                if role == "créateur":
                    self.log(f"Authentification réussie - Rôle: {role}")
                    return True
                else:
                    self.log(f"Rôle incorrect: {role}", False)
                    return False
            else:
                self.log(f"Échec de l'authentification: {response.status_code}", False)
                return False
        except Exception as e:
            self.log(f"Erreur d'authentification: {e}", False)
            return False
    
    def test_gears_api(self):
        """Test l'API des gears"""
        try:
            # Test GET gears
            response = requests.get(f"{BACKEND_URL}/gears")
            if response.status_code == 200:
                gears = response.json()
                categories = set(gear.get('category') for gear in gears)
                expected_categories = {'joueurs', 'modérateur', 'événements', 'interdits'}
                
                if expected_categories.issubset(categories):
                    self.log(f"API Gears OK - {len(gears)} gears dans {len(categories)} catégories")
                    return True
                else:
                    self.log(f"Catégories manquantes: {expected_categories - categories}", False)
                    return False
            else:
                self.log(f"Erreur API Gears: {response.status_code}", False)
                return False
        except Exception as e:
            self.log(f"Erreur API Gears: {e}", False)
            return False
    
    def test_suggestions_api(self):
        """Test l'API des suggestions"""
        if not self.token:
            self.log("Token manquant pour test suggestions", False)
            return False
        
        try:
            # Test soumission suggestion
            suggestion_data = {
                "name": "Test Gear",
                "nickname": "Test",
                "gear_id": "123456789",
                "image_url": "https://example.com/image.png",
                "description": "Gear de test",
                "category": "joueurs"
            }
            
            response = requests.post(f"{BACKEND_URL}/suggestions", json=suggestion_data)
            if response.status_code == 200:
                # Test récupération suggestions
                headers = {"Authorization": f"Bearer {self.token}"}
                response = requests.get(f"{BACKEND_URL}/suggestions", headers=headers)
                
                if response.status_code == 200:
                    suggestions = response.json()
                    self.log(f"API Suggestions OK - {len(suggestions)} suggestions")
                    return True
                else:
                    self.log(f"Erreur GET suggestions: {response.status_code}", False)
                    return False
            else:
                self.log(f"Erreur POST suggestion: {response.status_code}", False)
                return False
        except Exception as e:
            self.log(f"Erreur API Suggestions: {e}", False)
            return False
    
    def test_user_management(self):
        """Test la gestion des utilisateurs"""
        if not self.token:
            self.log("Token manquant pour test utilisateurs", False)
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(f"{BACKEND_URL}/users", headers=headers)
            
            if response.status_code == 200:
                users = response.json()
                self.log(f"Gestion utilisateurs OK - {len(users)} utilisateurs")
                return True
            else:
                self.log(f"Erreur API Users: {response.status_code}", False)
                return False
        except Exception as e:
            self.log(f"Erreur API Users: {e}", False)
            return False
    
    def run_all_tests(self):
        """Exécute tous les tests"""
        print("🚀 Démarrage des tests Center French Gear Hub")
        print("=" * 50)
        
        # Tests essentiels
        if not self.test_connection():
            print("❌ Échec de la connexion - Tests interrompus")
            return False
        
        if not self.test_authentication():
            print("❌ Échec de l'authentification - Tests interrompus")
            return False
        
        # Tests fonctionnels
        self.test_gears_api()
        self.test_suggestions_api()
        self.test_user_management()
        
        # Résumé
        print("\n" + "=" * 50)
        print(f"📊 Résultats: {self.passed} réussis, {self.failed} échoués")
        
        if self.failed == 0:
            print("🎉 Tous les tests sont passés ! Prêt pour le déploiement.")
            return True
        else:
            print("⚠️  Certains tests ont échoué. Vérifiez avant de déployer.")
            return False

def main():
    print("Center French Gear Hub - Suite de Tests")
    print("=" * 60)
    
    # Permettre de tester Vercel
    if len(sys.argv) > 1 and sys.argv[1] == "vercel":
        global BACKEND_URL
        BACKEND_URL = VERCEL_BACKEND_URL
        print(f"🌐 Test sur Vercel: {BACKEND_URL}")
    else:
        print(f"🏠 Test local: {BACKEND_URL}")
    
    test_suite = TestSuite()
    success = test_suite.run_all_tests()
    
    if success:
        print("\n✅ Site prêt pour la production !")
        exit(0)
    else:
        print("\n❌ Problèmes détectés - À corriger avant déploiement")
        exit(1)

if __name__ == "__main__":
    main()