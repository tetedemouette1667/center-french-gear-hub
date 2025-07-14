import os
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import json

# Database connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.roblox_gear_hub

# FastAPI app
app = FastAPI(title="Roblox Gear Hub API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "your-secret-key-here-change-in-production"
ALGORITHM = "HS256"

# Pydantic models
class GearBase(BaseModel):
    name: str
    nickname: str
    gear_id: str
    image_url: str
    description: str
    category: str  # "joueurs", "modérateur", "événements", "interdits"

class Gear(GearBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GearSuggestion(GearBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "pending"  # "pending", "approved", "rejected"

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    role: str  # "modérateur", "responsable", "créateur"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LoginRequest(BaseModel):
    username: str
    password: str

class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"username": username})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Initialize admin user on startup
@app.on_event("startup")
async def startup_event():
    # Check if root user exists
    root_user = await db.users.find_one({"username": "root"})
    if not root_user:
        # Create root user
        root_user_data = {
            "id": str(uuid.uuid4()),
            "username": "root",
            "password_hash": get_password_hash("Mouse123890!"),
            "role": "créateur",
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(root_user_data)
        print("Root user created successfully")

# Auth endpoints
@app.post("/api/auth/login", response_model=Token)
async def login(login_request: LoginRequest):
    user = await db.users.find_one({"username": login_request.username})
    if not user or not verify_password(login_request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token_expires = timedelta(hours=24)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"]
    }

@app.post("/api/auth/create-user")
async def create_user(user_request: CreateUserRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["créateur", "responsable"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Check if user already exists
    existing_user = await db.users.find_one({"username": user_request.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Create new user
    new_user = {
        "id": str(uuid.uuid4()),
        "username": user_request.username,
        "password_hash": get_password_hash(user_request.password),
        "role": user_request.role,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(new_user)
    return {"message": "User created successfully"}

# Gear endpoints
@app.get("/api/gears", response_model=List[Gear])
async def get_gears():
    gears = []
    async for gear in db.gears.find():
        gear["_id"] = str(gear["_id"])
        gears.append(gear)
    return gears

@app.post("/api/gears", response_model=Gear)
async def create_gear(gear: GearBase, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["créateur", "responsable"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    gear_data = gear.dict()
    gear_data["id"] = str(uuid.uuid4())
    gear_data["created_at"] = datetime.utcnow()
    
    await db.gears.insert_one(gear_data)
    return gear_data

@app.put("/api/gears/{gear_id}")
async def update_gear(gear_id: str, gear: GearBase, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["créateur", "responsable"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    result = await db.gears.update_one(
        {"id": gear_id},
        {"$set": gear.dict()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Gear not found")
    
    return {"message": "Gear updated successfully"}

@app.delete("/api/gears/{gear_id}")
async def delete_gear(gear_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["créateur", "responsable"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    result = await db.gears.delete_one({"id": gear_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gear not found")
    
    return {"message": "Gear deleted successfully"}

# Suggestion endpoints
@app.post("/api/suggestions", response_model=GearSuggestion)
async def create_suggestion(suggestion: GearBase):
    suggestion_data = suggestion.dict()
    suggestion_data["id"] = str(uuid.uuid4())
    suggestion_data["created_at"] = datetime.utcnow()
    suggestion_data["status"] = "pending"
    
    await db.suggestions.insert_one(suggestion_data)
    return suggestion_data

@app.get("/api/suggestions", response_model=List[GearSuggestion])
async def get_suggestions(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["créateur", "responsable", "modérateur"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    suggestions = []
    async for suggestion in db.suggestions.find():
        suggestion["_id"] = str(suggestion["_id"])
        suggestions.append(suggestion)
    return suggestions

@app.put("/api/suggestions/{suggestion_id}/approve")
async def approve_suggestion(suggestion_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["créateur", "responsable"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Get suggestion
    suggestion = await db.suggestions.find_one({"id": suggestion_id})
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    # Create gear from suggestion
    gear_data = {
        "id": str(uuid.uuid4()),
        "name": suggestion["name"],
        "nickname": suggestion["nickname"],
        "gear_id": suggestion["gear_id"],
        "image_url": suggestion["image_url"],
        "description": suggestion["description"],
        "category": suggestion["category"],
        "created_at": datetime.utcnow()
    }
    
    await db.gears.insert_one(gear_data)
    
    # Update suggestion status
    await db.suggestions.update_one(
        {"id": suggestion_id},
        {"$set": {"status": "approved"}}
    )
    
    return {"message": "Suggestion approved and gear created"}

@app.put("/api/suggestions/{suggestion_id}/reject")
async def reject_suggestion(suggestion_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["créateur", "responsable"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    result = await db.suggestions.update_one(
        {"id": suggestion_id},
        {"$set": {"status": "rejected"}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    return {"message": "Suggestion rejected"}

@app.get("/api/users", response_model=List[dict])
async def get_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "créateur":
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    users = []
    async for user in db.users.find():
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)  # Remove password hash from response
        users.append(user)
    return users

@app.get("/api/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    current_user.pop("password_hash", None)
    return current_user

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)