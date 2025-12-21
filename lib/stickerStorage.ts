import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Sticker, StickerPack } from "../types/sticker";

const STORAGE_KEYS = {
  PACKS: "@misticker:packs",
  STICKERS: "@misticker:stickers",
};

/**
 * Guarda un sticker en FileSystem y registra sus metadatos en AsyncStorage
 * @param base64Data - Datos base64 de la imagen (sin prefijo data:)
 * @param packId - ID del pack al que pertenece (opcional)
 * @returns El objeto Sticker creado
 */
export async function saveSticker(
  base64Data: string,
  packId: string | null = null
): Promise<Sticker> {
  // Generar ID único
  const stickerId = `sticker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Guardar imagen en FileSystem.documentDirectory
  const fileName = `${stickerId}.webp`;
  const fileUri = FileSystem.documentDirectory + fileName;

  await FileSystem.writeAsStringAsync(fileUri, base64Data, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Crear metadatos (SOLO URIs, IDs, fechas - NUNCA bytes o base64)
  const sticker: Sticker = {
    id: stickerId,
    uri: fileUri, // Solo la ruta, no los bytes
    packId,
    createdAt: new Date().toISOString(),
  };

  // Guardar metadatos en AsyncStorage
  const stickersData = await getStickersMetadata();
  stickersData[stickerId] = sticker;
  await AsyncStorage.setItem(STORAGE_KEYS.STICKERS, JSON.stringify(stickersData));

  return sticker;
}

/**
 * Obtiene todos los metadatos de stickers desde AsyncStorage
 * @returns Objeto con todos los stickers (solo metadatos)
 */
export async function getStickersMetadata(): Promise<Record<string, Sticker>> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.STICKERS);
    if (!stored) {
      return {};
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error loading stickers metadata:", error);
    return {};
  }
}

/**
 * Obtiene un sticker por ID
 * @param stickerId - ID del sticker
 * @returns El sticker o null si no existe
 */
export async function getSticker(stickerId: string): Promise<Sticker | null> {
  const stickers = await getStickersMetadata();
  return stickers[stickerId] || null;
}

/**
 * Obtiene todos los packs desde AsyncStorage
 * @returns Array de packs
 */
export async function getPacks(): Promise<StickerPack[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.PACKS);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error loading packs:", error);
    return [];
  }
}

/**
 * Guarda un pack en AsyncStorage
 * @param pack - El pack a guardar
 */
export async function savePack(pack: StickerPack): Promise<void> {
  const packs = await getPacks();
  const existingIndex = packs.findIndex((p) => p.id === pack.id);
  
  if (existingIndex >= 0) {
    packs[existingIndex] = pack;
  } else {
    packs.push(pack);
  }
  
  await AsyncStorage.setItem(STORAGE_KEYS.PACKS, JSON.stringify(packs));
}

/**
 * Crea un pack automático basado en la fecha actual
 * Si ya existe un pack para hoy, lo retorna. Si no, crea uno nuevo.
 * @returns El pack del día actual
 */
export async function getOrCreateTodayPack(): Promise<StickerPack> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const packName = `Pack ${today}`;
  
  const packs = await getPacks();
  const todayPack = packs.find(
    (p) => p.name === packName || p.createdAt.startsWith(today)
  );

  if (todayPack) {
    return todayPack;
  }

  // Crear nuevo pack para hoy
  const newPack: StickerPack = {
    id: `pack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: packName,
    stickerIds: [],
    createdAt: new Date().toISOString(),
    publisher: "MS App",
    website: "https://tudominio.com",
  };

  await savePack(newPack);
  return newPack;
}

/**
 * Crea un pack manual con un nombre personalizado
 * @param name - Nombre del pack
 * @returns El pack creado
 */
export async function createManualPack(name: string): Promise<StickerPack> {
  const pack: StickerPack = {
    id: `pack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    stickerIds: [],
    createdAt: new Date().toISOString(),
    publisher: "MS App",
    website: "https://tudominio.com",
  };

  await savePack(pack);
  return pack;
}

/**
 * Añade un sticker a un pack
 * @param stickerId - ID del sticker
 * @param packId - ID del pack
 */
export async function addStickerToPack(
  stickerId: string,
  packId: string
): Promise<void> {
  // Actualizar el sticker para que apunte al pack
  const stickers = await getStickersMetadata();
  if (stickers[stickerId]) {
    stickers[stickerId].packId = packId;
    await AsyncStorage.setItem(STORAGE_KEYS.STICKERS, JSON.stringify(stickers));
  }

  // Añadir el sticker al pack
  const packs = await getPacks();
  const pack = packs.find((p) => p.id === packId);
  if (pack && !pack.stickerIds.includes(stickerId)) {
    pack.stickerIds.push(stickerId);
    await savePack(pack);
  }
}

/**
 * Obtiene todos los stickers de un pack
 * @param packId - ID del pack
 * @returns Array de stickers del pack
 */
export async function getPackStickers(packId: string): Promise<Sticker[]> {
  const packs = await getPacks();
  const pack = packs.find((p) => p.id === packId);
  if (!pack) {
    return [];
  }

  const stickers = await getStickersMetadata();
  return pack.stickerIds
    .map((id) => stickers[id])
    .filter((sticker): sticker is Sticker => sticker !== undefined);
}

/**
 * Elimina un sticker (tanto el archivo como los metadatos)
 * @param stickerId - ID del sticker a eliminar
 */
export async function deleteSticker(stickerId: string): Promise<void> {
  const stickers = await getStickersMetadata();
  const sticker = stickers[stickerId];
  
  if (sticker) {
    // Eliminar archivo del FileSystem
    try {
      const fileInfo = await FileSystem.getInfoAsync(sticker.uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(sticker.uri, { idempotent: true });
      }
    } catch (error) {
      console.error("Error deleting sticker file:", error);
    }

    // Eliminar de los packs
    const packs = await getPacks();
    for (const pack of packs) {
      pack.stickerIds = pack.stickerIds.filter((id) => id !== stickerId);
      await savePack(pack);
    }

    // Eliminar metadatos
    delete stickers[stickerId];
    await AsyncStorage.setItem(STORAGE_KEYS.STICKERS, JSON.stringify(stickers));
  }
}

/**
 * Elimina un pack (no elimina los stickers, solo los quita del pack)
 * @param packId - ID del pack a eliminar
 */
export async function deletePack(packId: string): Promise<void> {
  const packs = await getPacks();
  const filteredPacks = packs.filter((p) => p.id !== packId);
  await AsyncStorage.setItem(STORAGE_KEYS.PACKS, JSON.stringify(filteredPacks));

  // Remover referencia del pack en los stickers
  const stickers = await getStickersMetadata();
  for (const stickerId in stickers) {
    if (stickers[stickerId].packId === packId) {
      stickers[stickerId].packId = null;
    }
  }
  await AsyncStorage.setItem(STORAGE_KEYS.STICKERS, JSON.stringify(stickers));
}

