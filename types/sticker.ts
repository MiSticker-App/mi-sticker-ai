export interface Sticker {
  id: string;
  uri: string; // Ruta del archivo en FileSystem.documentDirectory
  packId: string | null; // ID del pack al que pertenece, null si no está en un pack
  createdAt: string; // ISO string
}

export interface StickerPack {
  id: string;
  name: string;
  stickerIds: string[]; // IDs de los stickers en este pack
  createdAt: string; // ISO string
  publisher?: string; // Para metadatos de WhatsApp
  website?: string; // Para metadatos de WhatsApp
}

