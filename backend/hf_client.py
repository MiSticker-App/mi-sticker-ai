import os
import httpx
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
# Usar un modelo más accesible y rápido para inferencia
HF_MODEL = "HuggingFaceH4/zephyr-7b-beta"  # Modelo rápido y gratuito


async def get_hf_client() -> InferenceClient:
    """
    Dependency para obtener el cliente de Hugging Face.
    Crea un nuevo cliente cada vez (thread-safe para async).
    """
    if not HF_TOKEN:
        raise ValueError("HF_TOKEN no está configurado en el archivo .env")
    return InferenceClient(token=HF_TOKEN)


async def generate_magic_text(topic: str, client: InferenceClient = None) -> str:
    """
    Genera un texto 'dank' y viral para memes usando Hugging Face.
    Versión async para mejor performance con múltiples requests simultáneas.
    """
    if not client:
        client = await get_hf_client()

    system_prompt = (
        "Eres un generador de memes sarcástico y viral para Gen Z. "
        "Dado un tema, devuelve SOLO una frase corta, divertida y 'dank' en español. "
        "No incluyas explicaciones ni texto adicional, solo la frase."
    )

    user_prompt = f"Tema: {topic}"

    try:
        # Construir el prompt completo
        full_prompt = f"{system_prompt}\n\nUsuario: {user_prompt}\n\nAsistente:"
        
        # Usar httpx.AsyncClient para hacer llamadas async a la API de Hugging Face
        async with httpx.AsyncClient(timeout=30.0) as http_client:
            url = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
            headers = {
                "Authorization": f"Bearer {HF_TOKEN}",
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

        # Limpiar cualquier prefijo común
        text = text.replace("Frase:", "").replace("Texto:", "").replace("Asistente:", "").strip()
        
        # Si está vacío o es muy corto, devolver un fallback
        if not text or len(text) < 3:
            return "Juzgándote en silencio"
        
        return text
    except httpx.HTTPStatusError as e:
        print(f"Error HTTP de Hugging Face: {e.response.status_code} - {e.response.text}")
        # Fallback si falla la generación
        fallbacks = [
            "Juzgándote en silencio",
            "Cuando la vida te da limones...",
            "Mood: existencial",
            "No sé qué hacer con mi vida",
        ]
        import random
        return random.choice(fallbacks)
    except Exception as e:
        print(f"Error generando texto mágico: {e}")
        # Fallback si falla la generación
        fallbacks = [
            "Juzgándote en silencio",
            "Cuando la vida te da limones...",
            "Mood: existencial",
            "No sé qué hacer con mi vida",
        ]
        import random
        return random.choice(fallbacks)

