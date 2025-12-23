// lib/api.ts
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { GenerateMemeResponse, GenerateTextResponse } from '../types/sticker';

/**
 * Detecta la URL base de la API según la plataforma
 */
function getApiBaseUrl(): string {
  // Primero intenta obtener de variables de entorno
  const envUrl = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;
  
  if (envUrl) {
    return envUrl;
  }

  // Si estamos en desarrollo, usa localhost según la plataforma
  if (__DEV__) {
    if (Platform.OS === 'android') {
      // Android emulator usa 10.0.2.2 para localhost
      return 'http://10.0.2.2:8000';
    } else if (Platform.OS === 'ios') {
      // iOS simulator puede usar localhost directo
      return 'http://localhost:8000';
    }
  }

  // Fallback a producción (Railway)
  return 'https://mi-sticker-ai-production.up.railway.app';
}

const API_BASE_URL = getApiBaseUrl();

/**
 * Cliente API para comunicarse con el backend FastAPI
 */
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Genera un sticker con IA a partir de un prompt y una imagen
   */
  async generateMeme(prompt: string, imageUri: string): Promise<GenerateMemeResponse> {
    try {
    const formData = new FormData();
      formData.append('prompt', prompt);
      
      // Crear blob de la imagen para React Native
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      formData.append('image_file', {
      uri: imageUri,
        type: 'image/jpeg',
        name: 'image.jpg',
    } as any);

      const apiResponse = await fetch(`${this.baseUrl}/generate/meme`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!apiResponse.ok) {
        throw new Error(`API Error: ${apiResponse.status}`);
      }

      const data: GenerateMemeResponse = await apiResponse.json();
      return data;
    } catch (error) {
      console.error('Error generating meme:', error);
      throw error;
    }
  }

  /**
   * Genera texto con IA a partir de un contexto
   */
  async generateText(context: string): Promise<GenerateTextResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/generate/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data: GenerateTextResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating text:', error);
      throw error;
    }
  }

  /**
   * Obtiene la URL base de la API
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Exportar instancia única del cliente
export const api = new ApiClient();
