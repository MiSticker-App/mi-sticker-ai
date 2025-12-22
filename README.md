# MiSticker (MS) - FASE 1

App nativa Android para generar stickers con IA. Estética "TikTok Sleek".

## Stack Tecnológico

- **Framework**: Expo SDK 50+ (Managed Workflow)
- **Lenguaje**: TypeScript
- **Estilos**: NativeWind (Tailwind CSS) v4
- **Navegación**: Expo Router (File-based routing)
- **Iconos**: Lucide-react-native
- **Backend**: FastAPI (Python)
- **IA para Imágenes**: Fal.ai (Flux Schnell)
- **IA para Textos**: OpenAI GPT-4o-mini (principal) / Hugging Face (fallback)
- **Background Removal**: rembg (U2Net) - Offline, sin API keys
- **Procesamiento de Imágenes**: Pillow, OpenCV, NumPy

## Instalación y Setup

### Frontend (Expo)

1. Instala las dependencias:
```bash
npm install
```

2. Inicia el servidor de desarrollo:
```bash
npm start
# o
npm run android  # Para Android
npm run ios      # Para iOS
```

### Backend (FastAPI)

1. Activa el entorno virtual:
```bash
cd backend
source ../venv/bin/activate  # En macOS/Linux
# o
..\venv\Scripts\activate     # En Windows
```

2. Instala las dependencias:
```bash
pip install -r requirements.txt
```

3. Configura las variables de entorno:
```bash
# Copia el archivo de ejemplo
cp backend/.env.example backend/.env

# Edita backend/.env y añade tus claves:
# - FAL_KEY (requerida) - Obtén tu key en: https://fal.ai/dashboard
# - OPENAI_API_KEY (opcional) - Para generación de textos mejorada
# - HF_TOKEN (opcional) - Para fallback de textos: https://huggingface.co/settings/tokens
```

4. Inicia el servidor:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Configuración de Red Local

Para conectar la app con el backend en un dispositivo físico:

1. **Obtén tu IP local**:
   - macOS/Linux: `ifconfig | grep "inet "`
   - Windows: `ipconfig`

2. **Configura la IP local** (opcional):
   - Opción 1: Crea un archivo `.env` en la raíz del proyecto con:
     ```
     EXPO_PUBLIC_LOCAL_IP=192.168.1.100
     ```
   - Opción 2: Edita `lib/api.ts` y cambia `LOCAL_NETWORK_IP` directamente

3. **Asegúrate de que ambos dispositivos estén en la misma red WiFi**

## Estructura del Proyecto

```
misticker/
├── app/                    # Rutas de Expo Router
│   ├── (tabs)/            # Pantallas con tabs
│   │   ├── create.tsx    # Pantalla de creación
│   │   └── gallery.tsx   # Galería de stickers
│   └── _layout.tsx       # Layout raíz
├── components/            # Componentes reutilizables
│   ├── Button.tsx
│   └── StickerPreview.tsx
├── hooks/                 # Custom hooks
│   └── useDailyLimit.ts  # Hook para límite diario
├── lib/                   # Utilidades y servicios
│   ├── api.ts            # Cliente API
│   └── utils.ts          # Utilidades (cn)
├── backend/               # Backend FastAPI
│   ├── main.py           # API principal
│   └── hf_client.py      # Cliente Hugging Face
└── assets/                # Assets (iconos, imágenes)
```

## Características Implementadas

- ✅ Navegación con tabs flotantes estilo TikTok
- ✅ Pantalla Create con preview, input y botón de generación
- ✅ Botón "Varita Mágica" ✨ para generar textos con IA
- ✅ Sistema de límite diario (5 generaciones cada 24h)
- ✅ Pantalla Gallery con grid de 2 columnas
- ✅ Generación de imágenes con IA usando Fal.ai (Flux Schnell)
- ✅ Generación de textos con OpenAI GPT-4o-mini (fallback a Hugging Face)
- ✅ Background removal automático con rembg (offline, sin API keys)
- ✅ Procesamiento de stickers: fondo transparente + borde blanco + optimización WEBP
- ✅ Diseño "TikTok Sleek" (fondo negro, estética minimalista)

## Próximos Pasos (Futuras Fases)

- Sincronización de stickers en la nube (Supabase/Firebase)
- Compartir stickers directamente a WhatsApp
- Sistema de autenticación
- Más opciones de personalización (estilos, filtros)
- Analytics y métricas de uso

## Notas

- El límite diario se guarda localmente usando AsyncStorage
- Los stickers se guardan localmente en el dispositivo (FileSystem + AsyncStorage)
- El backend debe estar corriendo para que la app funcione completamente
- Para dispositivos físicos, asegúrate de configurar la IP local correctamente
- Background removal funciona offline usando el modelo U2Net (se descarga automáticamente la primera vez)
- Fal.ai es el servicio principal para generación de imágenes (requiere API key)
- OpenAI es opcional pero mejora la calidad de los textos generados

