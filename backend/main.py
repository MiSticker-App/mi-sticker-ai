"""
Aplicación principal FastAPI para MiSticker API.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import stickers

app = FastAPI(
    title="MiSticker API",
    description="El motor detrás de tus stickers"
)

# Configurar CORS para permitir requests del frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica los dominios exactos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(stickers.router)

# Ruta de prueba para saber que el servidor vive
@app.get("/")
async def health_check():
    return {"status": "online", "vibe": "dank"}
