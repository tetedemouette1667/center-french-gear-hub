#!/usr/bin/env python3
"""
Script d'initialisation pour Vercel
Initialise la base de données avec des données de test
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import uuid
from passlib.context import CryptContext

# Configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

# Sample gears data avec de vraies images Roblox
sample_gears = [
    {
        "id": str(uuid.uuid4()),
        "name": "Sword of the Ancient",
        "nickname": "Épée Légendaire",
        "gear_id": "123456789",
        "image_url": "https://assetdelivery.roblox.com/v1/asset/?id=16134749",
        "description": "Une épée puissante forgée dans les temps anciens.",
        "category": "joueurs",
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Lightning Bolt",
        "nickname": "Éclair Divin",
        "gear_id": "987654321",
        "image_url": "https://assetdelivery.roblox.com/v1/asset/?id=12902404",
        "description": "Un éclair qui frappe les ennemis avec une puissance divine.",
        "category": "joueurs",
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Shield of Defense",
        "nickname": "Bouclier Défensif",
        "gear_id": "111222333",
        "image_url": "https://assetdelivery.roblox.com/v1/asset/?id=11377306",
        "description": "Un bouclier qui protège contre les attaques.",
        "category": "joueurs",
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Staff of Power",
        "nickname": "Bâton Magique",
        "gear_id": "444555666",
        "image_url": "https://assetdelivery.roblox.com/v1/asset/?id=13838250",
        "description": "Un bâton magique qui augmente les pouvoirs des modérateurs.",
        "category": "modérateur",
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Admin Portal Gun",
        "nickname": "Pistolet Portail Admin",
        "gear_id": "777888999",
        "image_url": "https://assetdelivery.roblox.com/v1/asset/?id=13838309",
        "description": "Permet de créer des portails pour les modérateurs.",
        "category": "modérateur",
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Fireworks Launcher",
        "nickname": "Lance-Feux",
        "gear_id": "456789123",
        "image_url": "https://assetdelivery.roblox.com/v1/asset/?id=12902404",
        "description": "Lance des feux d'artifice spectaculaires pour les événements.",
        "category": "événements",
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Party Horn",
        "nickname": "Cor de Fête",
        "gear_id": "321654987",
        "image_url": "https://assetdelivery.roblox.com/v1/asset/?id=12144993",
        "description": "Fait du bruit pour animer les événements.",
        "category": "événements",
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Celebration Confetti",
        "nickname": "Confettis de Fête",
        "gear_id": "159753486",
        "image_url": "https://assetdelivery.roblox.com/v1/asset/?id=12144993",
        "description": "Lance des confettis pour célébrer les événements spéciaux.",
        "category": "événements",
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Banned Weapon",
        "nickname": "Arme Interdite",
        "gear_id": "000000000",
        "image_url": "https://assetdelivery.roblox.com/v1/asset/?id=16975630",
        "description": "Cette arme est trop puissante et donc strictement interdite.",
        "category": "interdits",
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Exploit Tool",
        "nickname": "Outil d'Exploit",
        "gear_id": "999999999",
        "image_url": "https://assetdelivery.roblox.com/v1/asset/?id=16975630",
        "description": "Outil utilisé pour exploiter - strictement interdit.",
        "category": "interdits",
        "created_at": datetime.utcnow()
    }
]

async def initialize_database():
    """Initialise la base de données avec les données de test"""
    
    # Obtenir l'URL MongoDB depuis les variables d'environnement
    mongo_url = os.environ.get('MONGO_URL')
    if not mongo_url:
        print("❌ MONGO_URL non trouvée dans les variables d'environnement")
        return False
    
    try:
        # Connexion à MongoDB
        client = AsyncIOMotorClient(mongo_url)
        db = client.roblox_gear_hub
        
        # Vérifier la connexion
        await client.admin.command('ping')
        print("✅ Connexion à MongoDB établie")
        
        # Vérifier si des données existent déjà
        existing_gears = await db.gears.count_documents({})
        existing_users = await db.users.count_documents({})
        
        # Initialiser les gears si nécessaire
        if existing_gears == 0:
            await db.gears.insert_many(sample_gears)
            print(f"✅ {len(sample_gears)} gears ajoutés à la base de données")
        else:
            print(f"ℹ️  {existing_gears} gears déjà présents dans la base")
        
        # Créer l'utilisateur root si nécessaire
        if existing_users == 0:
            root_user = {
                "id": str(uuid.uuid4()),
                "username": "root",
                "password_hash": get_password_hash("Mouse123890!"),
                "role": "créateur",
                "created_at": datetime.utcnow()
            }
            await db.users.insert_one(root_user)
            print("✅ Utilisateur root créé")
        else:
            print(f"ℹ️  {existing_users} utilisateurs déjà présents dans la base")
        
        # Compter les gears par catégorie
        for category in ["joueurs", "modérateur", "événements", "interdits"]:
            count = await db.gears.count_documents({"category": category})
            print(f"   - {category}: {count} gears")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de l'initialisation: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(initialize_database())
    if success:
        print("\n🎉 Base de données initialisée avec succès !")
    else:
        print("\n💥 Échec de l'initialisation de la base de données")
        exit(1)