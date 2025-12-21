"""
Configuración y variables de entorno para la aplicación.
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()


class Settings(BaseSettings):
    """Configuración de la aplicación con validación de Pydantic."""
    
    # Fal.ai
    FAL_KEY: str
    
    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    
    # Hugging Face (opcional, para fallback)
    HF_TOKEN: Optional[str] = None
    
    # Modelo de Hugging Face para fallback
    HF_MODEL: str = "HuggingFaceH4/zephyr-7b-beta"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Instancia global de configuración
settings = Settings()

# Validar variables críticas al iniciar
if not settings.FAL_KEY:
    raise ValueError("FAL_KEY es requerida. Configúrala en el archivo .env")

