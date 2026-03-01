from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import news, ai

app = FastAPI(title="GeoIntel-360 API")

# Configure CORS for React frontend (Vite defaults to 5173, CRA to 3000)
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(news.router, prefix="/api")
app.include_router(ai.router, prefix="/api")

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "GeoIntel-360 Backend"}
