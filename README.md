# MiSticker (MS) - FASE 1

App nativa Android para generar stickers con IA. Estética "TikTok Sleek".

## Stack Tecnológico

- **Framework**: Expo SDK 50+ (Managed Workflow)
- **Lenguaje**: TypeScript
- **Estilos**: NativeWind (Tailwind CSS) v4
- **Navegación**: Expo Router (File-based routing)
- **Iconos**: Lucide-react-native
- **Backend**: FastAPI (Python)

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

2. Instala las dependencias (si aún no lo has hecho):
```bash
pip install fastapi uvicorn huggingface_hub python-dotenv pydantic
```

3. Configura el token de Hugging Face:
```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita .env y añade tu token de Hugging Face
# Obtén tu token en: https://huggingface.co/settings/tokens
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

2. **Actualiza la IP en el frontend**:
   - Edita `lib/api.ts`
   - Cambia `LOCAL_NETWORK_IP` por tu IP local (ej: `192.168.1.100`)

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
- ✅ Integración con Hugging Face para generación de textos
- ✅ Diseño "TikTok Sleek" (fondo negro, estética minimalista)

## Próximos Pasos (Futuras Fases)

- Integración real con Fal.ai para generación de stickers
- Persistencia de stickers generados
- Compartir stickers
- Sistema de autenticación
- Más opciones de personalización

## Notas

- El límite diario se guarda localmente usando AsyncStorage
- El backend debe estar corriendo para que la app funcione completamente
- Para dispositivos físicos, asegúrate de configurar la IP local correctamente

