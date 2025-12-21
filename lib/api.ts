import { Platform } from "react-native";

// Para dispositivo físico, ajusta esta IP según tu red local
const LOCAL_NETWORK_IP = "192.168.1.100"; // Cambia esto por tu IP local

function getBaseUrl(): string {
  if (Platform.OS === "android") {
    // Emulador Android usa 10.0.2.2 para localhost
    return "http://10.0.2.2:8000";
  }
  // Para iOS simulator o dispositivo físico, usa la IP local
  return `http://${LOCAL_NETWORK_IP}:8000`;
}

const BASE_URL = getBaseUrl();

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

async function postFormData<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    body: formData,
    // No establecer Content-Type manualmente, el navegador lo hará con el boundary correcto
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export interface GenerateMemeResponse {
  success: boolean;
  image_base64: string;
  message?: string;
}

export interface GenerateTextResponse {
  text: string;
  success?: boolean;
}

export const api = {
  async generateMeme(prompt: string, imageUri: string): Promise<GenerateMemeResponse> {
    const formData = new FormData();
    formData.append("prompt", prompt);
    
    // Convertir URI local a archivo para FormData
    const filename = imageUri.split("/").pop() || "image.jpg";
    const fileType = imageUri.endsWith(".png") ? "image/png" : "image/jpeg";
    
    formData.append("image_file", {
      uri: imageUri,
      type: fileType,
      name: filename,
    } as any);

    return postFormData<GenerateMemeResponse>("/generate/meme", formData);
  },

  async generateText(context: string): Promise<GenerateTextResponse> {
    return post<GenerateTextResponse>("/generate/text", { context });
  },
};

