export interface Sticker {
  id: string;
  uri: string; // Ruta del archivo en FileSystem.documentDirectory
  packId: string | null;
  createdAt: string; // ISO string
}

export interface StickerPack {
  id: string;
  name: string;
  stickerIds: string[];
  createdAt: string; // ISO string
  publisher?: string;
  website?: string;
}

export interface DailyLimit {
  generationsCount: number;
  lastResetDate: string; // ISO string
}

export interface GenerateMemeResponse {
  success: boolean;
  image_base64?: string;
  message?: string;
}

export interface GenerateTextResponse {
  text: string;
  success?: boolean;
}

