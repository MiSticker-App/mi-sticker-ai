"""
Endpoints para generación de stickers y memes.
"""
import base64
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, HttpUrl
import httpx

from app.services.ai_generator import AIGeneratorService
from app.services.image_processor import StickerProcessor

router = APIRouter(prefix="/generate", tags=["stickers"])

# Instancias de servicios (singleton pattern)
ai_service = AIGeneratorService()
sticker_processor = StickerProcessor()


# Modelos Pydantic para requests/responses
class MemeRequest(BaseModel):
    """Request para generar meme con IA."""
    prompt: str
    image_url: Optional[HttpUrl] = None


class MemeResponse(BaseModel):
    """Response con sticker generado."""
    success: bool
    image_base64: str
    message: str = "Sticker generado exitosamente"


class StickerOnlyRequest(BaseModel):
    """Request para procesar sticker sin IA."""
    image_url: Optional[HttpUrl] = None


class StickerOnlyResponse(BaseModel):
    """Response con sticker procesado."""
    success: bool
    image_base64: str
    message: str = "Sticker procesado exitosamente"


class TextRequest(BaseModel):
    """Request para generar texto viral."""
    context: str


class TextResponse(BaseModel):
    """Response con texto generado."""
    text: str
    success: bool = True


@router.post("/meme", response_model=MemeResponse)
async def generate_meme(
    prompt: str = Form(...),
    image_url: Optional[str] = Form(None),
    image_file: Optional[UploadFile] = File(None)
):
    """
    Genera un meme usando IA (Fal.ai) con preservación de identidad facial.
    
    Acepta:
    - prompt: Descripción del meme
    - image_url: URL de la imagen del usuario (opcional)
    - image_file: Archivo de imagen subido (opcional)
    
    Al menos uno de image_url o image_file debe ser proporcionado.
    """
    try:
        # Validar que haya imagen
        if not image_url and not image_file:
            raise HTTPException(
                status_code=400,
                detail="Debes proporcionar image_url o image_file"
            )
        
        # Obtener bytes de la imagen
        image_bytes = await _get_image_bytes(image_url, image_file)
        
        # Generar imagen con IA
        generated_image_bytes = await ai_service.generate_meme_image(
            prompt=prompt,
            image_bytes=image_bytes
        )
        
        # Procesar imagen para crear sticker
        sticker_bytes = sticker_processor.create_sticker(generated_image_bytes)
        
        # Convertir a base64 para respuesta
        image_base64 = base64.b64encode(sticker_bytes).decode("utf-8")
        
        return MemeResponse(
            success=True,
            image_base64=image_base64,
            message="Meme generado exitosamente"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generando meme: {str(e)}"
        )


@router.post("/sticker-only", response_model=StickerOnlyResponse)
async def generate_sticker_only(
    image_url: Optional[str] = Form(None),
    image_file: Optional[UploadFile] = File(None)
):
    """
    Procesa una imagen para crear un sticker (quita fondo, añade borde blanco).
    
    Acepta:
    - image_url: URL de la imagen (opcional)
    - image_file: Archivo de imagen subido (opcional)
    
    Al menos uno de image_url o image_file debe ser proporcionado.
    """
    try:
        # Validar que haya imagen
        if not image_url and not image_file:
            raise HTTPException(
                status_code=400,
                detail="Debes proporcionar image_url o image_file"
            )
        
        # Obtener bytes de la imagen
        image_bytes = await _get_image_bytes(image_url, image_file)
        
        # Procesar imagen para crear sticker
        sticker_bytes = sticker_processor.create_sticker(image_bytes)
        
        # Convertir a base64 para respuesta
        image_base64 = base64.b64encode(sticker_bytes).decode("utf-8")
        
        return StickerOnlyResponse(
            success=True,
            image_base64=image_base64,
            message="Sticker procesado exitosamente"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando sticker: {str(e)}"
        )


@router.post("/text", response_model=TextResponse)
async def generate_text(request: TextRequest):
    """
    Genera un texto viral y sarcástico para stickers.
    
    Acepta:
    - context: Contexto o tema para generar el texto
    """
    try:
        text = await ai_service.generate_magic_text(request.context)
        
        return TextResponse(
            text=text,
            success=True
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generando texto: {str(e)}"
        )


# Función auxiliar para obtener bytes de imagen
async def _get_image_bytes(
    image_url: Optional[str],
    image_file: Optional[UploadFile]
) -> bytes:
    """
    Obtiene bytes de imagen desde URL o archivo subido.
    
    Args:
        image_url: URL de la imagen
        image_file: Archivo subido
        
    Returns:
        Bytes de la imagen
    """
    if image_file:
        # Leer bytes del archivo subido
        return await image_file.read()
    
    elif image_url:
        # Descargar imagen desde URL
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(image_url)
                response.raise_for_status()
                return response.content
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Error descargando imagen desde URL: {str(e)}"
            )
    
    else:
        raise HTTPException(
            status_code=400,
            detail="Debes proporcionar image_url o image_file"
        )

