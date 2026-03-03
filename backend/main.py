from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager

load_dotenv()

from routers import news, ai
from database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="GeoIntel-360 API", lifespan=lifespan)

# Configure CORS for React frontend (Vite defaults to 5173, CRA to 3000)
# Allowing all origins and disabling credentials for local development via IP
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(news.router, prefix="/api")
app.include_router(ai.router, prefix="/api")

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "GeoIntel-360 Backend"}
