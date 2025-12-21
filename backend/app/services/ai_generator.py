"""
Servicio de generación de IA para memes y textos.
"""
import os
import httpx
import fal_client
from typing import Optional
from fastapi import HTTPException
from openai import AsyncOpenAI

from app.config import settings


class AIGeneratorService:
    """Servicio para generar imágenes con IA y textos virales."""
    
    def __init__(self):
        self.fal_key = settings.FAL_KEY
        # Configurar FAL_KEY en el entorno para fal_client
        os.environ["FAL_KEY"] = self.fal_key
        
        self.openai_client = None
        if settings.OPENAI_API_KEY:
            self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    
    async def generate_meme_image(self, prompt: str, image_bytes: bytes) -> bytes:
        """
        Genera una imagen de meme usando Fal.ai con preservación de identidad facial.
        
        Args:
            prompt: Descripción del meme a generar
            image_bytes: Bytes de la imagen del usuario para preservar identidad
            
        Returns:
            Bytes de la imagen generada
            
        Raises:
            HTTPException: Si falla la generación
        """
        try:
            # CRÍTICO: Subir imagen a la nube temporal de Fal (Fal.ai NO puede leer archivos locales)
            # fal_client.upload() sube los bytes y devuelve una URL pública
            uploaded_url = await self._upload_to_fal(image_bytes)
            
            # Intentar primero con Flux Schnell (rápido y barato)
            endpoints_to_try = [
                "fal-ai/flux/schnell",
                "fal-ai/flux/dev",  # Fallback si Schnell no preserva bien la identidad
                "fal-ai/fast-sdxl",  # Alternativa robusta con IP-Adapter más maduro
            ]
            
            last_error = None
            for endpoint in endpoints_to_try:
                try:
                    # Intentar diferentes métodos de fal_client según la versión de la librería
                    # fal_client puede tener run(), submit(), o subscribe()
                    try:
                        # Método 1: run() (más común)
                        result = await fal_client.run(
                            endpoint,
                            arguments={
                                "prompt": prompt,
                                "image_url": uploaded_url,  # URL pública de Fal
                                "num_inference_steps": 30,
                                "guidance_scale": 7.5,
                            }
                        )
                    except AttributeError:
                        # Método 2: submit() si run() no existe
                        try:
                            result = await fal_client.submit(
                                endpoint,
                                arguments={
                                    "prompt": prompt,
                                    "image_url": uploaded_url,
                                    "num_inference_steps": 30,
                                    "guidance_scale": 7.5,
                                }
                            )
                        except AttributeError:
                            # Método 3: subscribe() si submit() tampoco existe
                            result = await fal_client.subscribe(
                                endpoint,
                                arguments={
                                    "prompt": prompt,
                                    "image_url": uploaded_url,
                                    "num_inference_steps": 30,
                                    "guidance_scale": 7.5,
                                }
                            )
                    
                    # Obtener la URL de la imagen generada
                    # El formato puede variar según el endpoint
                    image_url = None
                    if isinstance(result, dict):
                        # Intentar diferentes formatos de respuesta
                        if "images" in result and len(result["images"]) > 0:
                            image_url = result["images"][0].get("url")
                        elif "image" in result:
                            image_url = result["image"].get("url") if isinstance(result["image"], dict) else result["image"]
                        elif "url" in result:
                            image_url = result["url"]
                    elif isinstance(result, str):
                        image_url = result
                    
                    if not image_url:
                        raise ValueError(f"No se obtuvo URL de imagen del resultado: {result}")
                    
                    # Descargar la imagen generada
                    async with httpx.AsyncClient(timeout=30.0) as client:
                        response = await client.get(image_url)
                        response.raise_for_status()
                        return response.content
                        
                except Exception as e:
                    last_error = e
                    print(f"Error con endpoint {endpoint}: {e}")
                    continue
            
            # Si todos los endpoints fallaron
            raise HTTPException(
                status_code=500,
                detail=f"Error generando imagen con Fal.ai: {str(last_error)}"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error inesperado generando imagen: {str(e)}"
            )
    
    async def _upload_to_fal(self, image_bytes: bytes) -> str:
        """
        Sube una imagen a la nube temporal de Fal y devuelve la URL pública.
        
        Args:
            image_bytes: Bytes de la imagen a subir
            
        Returns:
            URL pública de la imagen en Fal
        """
        try:
            # Usar la API REST de Fal para subir el archivo
            # Fal tiene un endpoint específico para uploads
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {
                    "Authorization": f"Key {self.fal_key}",
                }
                files = {
                    "file": ("image.jpg", image_bytes, "image/jpeg")
                }
                response = await client.post(
                    "https://fal.run/fal-ai/file-upload",
                    files=files,
                    headers=headers
                )
                response.raise_for_status()
                result = response.json()
                
                # La respuesta puede tener diferentes formatos
                url = result.get("url") or result.get("file_url") or result.get("urls", [None])[0]
                if not url:
                    raise ValueError("No se obtuvo URL del upload")
                return url
                
        except Exception as upload_error:
            raise HTTPException(
                status_code=500,
                detail=f"Error subiendo imagen a Fal: {str(upload_error)}"
            )
    
    async def generate_magic_text(self, context: str) -> str:
        """
        Genera un texto viral y sarcástico para stickers.
        
        Args:
            context: Contexto o tema para generar el texto
            
        Returns:
            Texto generado (máximo 10 palabras)
        """
        # Intentar primero con OpenAI (más rápido y confiable)
        if self.openai_client:
            try:
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "system",
                            "content": "Eres un generador de textos para stickers virales. Genera una frase corta, sarcástica y divertida basada en el contexto del usuario. Máximo 10 palabras."
                        },
                        {
                            "role": "user",
                            "content": f"Contexto: {context}"
                        }
                    ],
                    max_tokens=30,
                    temperature=0.9,
                )
                
                text = response.choices[0].message.content.strip()
                # Limpiar y validar
                text = self._clean_text(text)
                if text and len(text.split()) <= 10:
                    return text
                    
            except Exception as e:
                print(f"Error con OpenAI, usando fallback: {e}")
        
        # Fallback: Usar Hugging Face (código existente)
        return await self._generate_text_hf_fallback(context)
    
    async def _generate_text_hf_fallback(self, context: str) -> str:
        """
        Genera texto usando Hugging Face como fallback.
        Basado en el código existente de hf_client.py
        """
        if not settings.HF_TOKEN:
            # Si no hay HF_TOKEN, devolver fallback hardcoded
            fallbacks = [
                "Juzgándote en silencio",
                "Cuando la vida te da limones...",
                "Mood: existencial",
                "No sé qué hacer con mi vida",
            ]
            import random
            return random.choice(fallbacks)
        
        try:
            system_prompt = (
                "Eres un generador de memes sarcástico y viral para Gen Z. "
                "Dado un tema, devuelve SOLO una frase corta, divertida y 'dank' en español. "
                "No incluyas explicaciones ni texto adicional, solo la frase."
            )
            
            user_prompt = f"Tema: {context}"
            full_prompt = f"{system_prompt}\n\nUsuario: {user_prompt}\n\nAsistente:"
            
            async with httpx.AsyncClient(timeout=30.0) as http_client:
                url = f"https://api-inference.huggingface.co/models/{settings.HF_MODEL}"
                headers = {
                    "Authorization": f"Bearer {settings.HF_TOKEN}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "inputs": full_prompt,
                    "parameters": {
                        "max_new_tokens": 50,
                        "temperature": 0.9,
                        "top_p": 0.95,
                        "return_full_text": False,
                    }
                }
                
                response = await http_client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                
                result = response.json()
                
                # Procesar la respuesta
                if isinstance(result, list) and len(result) > 0:
                    text = result[0].get("generated_text", "").strip()
                elif isinstance(result, dict) and "generated_text" in result:
                    text = result["generated_text"].strip()
                else:
                    text = str(result).strip()
            
            # Limpiar texto
            text = self._clean_text(text)
            
            # Si está vacío o es muy corto, devolver fallback
            if not text or len(text) < 3:
                return "Juzgándote en silencio"
            
            return text
            
        except Exception as e:
            print(f"Error generando texto con Hugging Face: {e}")
            # Fallback hardcoded
            fallbacks = [
                "Juzgándote en silencio",
                "Cuando la vida te da limones...",
                "Mood: existencial",
                "No sé qué hacer con mi vida",
            ]
            import random
            return random.choice(fallbacks)
    
    def _clean_text(self, text: str) -> str:
        """Limpia el texto generado eliminando prefijos comunes."""
        text = text.replace("Frase:", "").replace("Texto:", "").replace("Asistente:", "").strip()
        # Limitar a 10 palabras
        words = text.split()
        if len(words) > 10:
            text = " ".join(words[:10])
        return text

