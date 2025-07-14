import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import uuid

# Database connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.roblox_gear_hub

# Sample gears data with real Roblox gear images
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
        "name": "Staff of Power",
        "nickname": "Bâton Magique",
        "gear_id": "987654321",
        "image_url": "https://assetdelivery.roblox.com/v1/asset/?id=13838250",
        "description": "Un bâton magique qui augmente les pouvoirs.",
        "category": "modérateur",
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Fireworks Launcher",
        "nickname": "Lance-Feux",
        "gear_id": "456789123",
        "image_url": "https://assetdelivery.roblox.com/v1/asset/?id=12902404",
        "description": "Lance des feux d'artifice spectaculaires.",
        "category": "événements",
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Banned Weapon",
        "nickname": "Arme Interdite",
        "gear_id": "000000000",
        "image_url": "https://assetdelivery.roblox.com/v1/asset/?id=16975630",
        "description": "Cette arme est trop puissante et donc interdite.",
        "category": "interdits",
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
        "name": "Admin Portal Gun",
        "nickname": "Pistolet Portail Admin",
        "gear_id": "444555666",
        "image_url": "https://assetdelivery.roblox.com/v1/asset/?id=13838309",
        "description": "Permet de créer des portails pour les modérateurs.",
        "category": "modérateur",
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Party Horn",
        "nickname": "Cor de Fête",
        "gear_id": "777888999",
        "image_url": "https://assetdelivery.roblox.com/v1/asset/?id=12144993",
        "description": "Fait du bruit pour animer les événements.",
        "category": "événements",
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

async def init_database():
    try:
        # Clear existing gears
        await db.gears.delete_many({})
        
        # Insert sample gears
        await db.gears.insert_many(sample_gears)
        
        print(f"✅ Database initialized with {len(sample_gears)} sample gears")
        
        # Count gears per category
        for category in ["joueurs", "modérateur", "événements", "interdits"]:
            count = await db.gears.count_documents({"category": category})
            print(f"   - {category}: {count} gears")
            
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(init_database())