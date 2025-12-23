// lib/stickerStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import type { Sticker, StickerPack } from '../types/sticker';
import { generateId, isToday } from './utils';

const STICKERS_KEY = '@misticker:stickers';
const PACKS_KEY = '@misticker:packs';

/**
 * Guarda un sticker en el sistema de archivos y almacena sus metadatos
 */
export async function saveSticker(
  base64Data: string,
  packId: string | null = null
): Promise<Sticker> {
  try {
    const stickerId = generateId();
    const fileName = `sticker_${stickerId}.webp`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    // Remover el prefijo data:image si existe
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');

    // Guardar imagen en el sistema de archivos
    await FileSystem.writeAsStringAsync(fileUri, base64Image, {
    encoding: FileSystem.EncodingType.Base64,
  });

    // Crear objeto Sticker
  const sticker: Sticker = {
    id: stickerId,
      uri: fileUri,
    packId,
    createdAt: new Date().toISOString(),
  };

  // Guardar metadatos en AsyncStorage
    const stickersData = await AsyncStorage.getItem(STICKERS_KEY);
    const stickers = stickersData ? JSON.parse(stickersData) : {};
    stickers[stickerId] = sticker;
    await AsyncStorage.setItem(STICKERS_KEY, JSON.stringify(stickers));

  return sticker;
  } catch (error) {
    console.error('Error saving sticker:', error);
    throw error;
  }
}

/**
 * Obtiene o crea el pack del día actual
 */
export async function getOrCreateTodayPack(): Promise<StickerPack> {
  try {
    const packsData = await AsyncStorage.getItem(PACKS_KEY);
    const packs: StickerPack[] = packsData ? JSON.parse(packsData) : [];

    // Buscar pack de hoy
    const todayPack = packs.find(
      (pack) => isToday(pack.createdAt) && pack.name.startsWith('Pack ')
    );

    if (todayPack) {
      return todayPack;
    }

    // Crear nuevo pack del día
    const today = new Date();
    const packName = `Pack ${today.toISOString().split('T')[0]}`;
    const newPack: StickerPack = {
      id: generateId(),
      name: packName,
      stickerIds: [],
      createdAt: today.toISOString(),
    };

    packs.unshift(newPack);
    await AsyncStorage.setItem(PACKS_KEY, JSON.stringify(packs));

    return newPack;
  } catch (error) {
    console.error('Error getting/creating today pack:', error);
    throw error;
  }
}

/**
 * Crea un pack manual con nombre personalizado
 */
export async function createManualPack(name: string): Promise<StickerPack> {
  try {
    const packsData = await AsyncStorage.getItem(PACKS_KEY);
    const packs: StickerPack[] = packsData ? JSON.parse(packsData) : [];

    const newPack: StickerPack = {
      id: generateId(),
      name,
      stickerIds: [],
      createdAt: new Date().toISOString(),
    };

    packs.unshift(newPack);
    await AsyncStorage.setItem(PACKS_KEY, JSON.stringify(packs));

    return newPack;
  } catch (error) {
    console.error('Error creating manual pack:', error);
    throw error;
  }
}

/**
 * Obtiene todos los packs
 */
export async function getPacks(): Promise<StickerPack[]> {
  try {
    const packsData = await AsyncStorage.getItem(PACKS_KEY);
    return packsData ? JSON.parse(packsData) : [];
  } catch (error) {
    console.error('Error getting packs:', error);
    return [];
  }
}

/**
 * Obtiene un pack por su ID
 */
export async function getPack(packId: string): Promise<StickerPack | null> {
  try {
  const packs = await getPacks();
    return packs.find((pack) => pack.id === packId) || null;
  } catch (error) {
    console.error('Error getting pack:', error);
    return null;
  }
}

/**
 * Obtiene todos los stickers de un pack
 */
export async function getPackStickers(packId: string): Promise<Sticker[]> {
  try {
    const pack = await getPack(packId);
    if (!pack) return [];

    const stickersData = await AsyncStorage.getItem(STICKERS_KEY);
    const allStickers = stickersData ? JSON.parse(stickersData) : {};

    return pack.stickerIds
      .map((id) => allStickers[id])
      .filter((sticker) => sticker !== undefined);
  } catch (error) {
    console.error('Error getting pack stickers:', error);
    return [];
  }
}

/**
 * Añade un sticker a un pack
 */
export async function addStickerToPack(
  stickerId: string,
  packId: string
): Promise<void> {
  try {
    const packsData = await AsyncStorage.getItem(PACKS_KEY);
    const packs: StickerPack[] = packsData ? JSON.parse(packsData) : [];

    const packIndex = packs.findIndex((pack) => pack.id === packId);
    if (packIndex === -1) {
      throw new Error('Pack not found');
    }

    if (!packs[packIndex].stickerIds.includes(stickerId)) {
      packs[packIndex].stickerIds.push(stickerId);
      await AsyncStorage.setItem(PACKS_KEY, JSON.stringify(packs));
    }

    // Actualizar packId del sticker
    const stickersData = await AsyncStorage.getItem(STICKERS_KEY);
    const stickers = stickersData ? JSON.parse(stickersData) : {};
  if (stickers[stickerId]) {
    stickers[stickerId].packId = packId;
      await AsyncStorage.setItem(STICKERS_KEY, JSON.stringify(stickers));
    }
  } catch (error) {
    console.error('Error adding sticker to pack:', error);
    throw error;
  }
}

/**
 * Elimina un sticker del sistema de archivos y de los metadatos
 */
export async function deleteSticker(stickerId: string): Promise<void> {
  try {
    // Obtener sticker
    const stickersData = await AsyncStorage.getItem(STICKERS_KEY);
    const stickers = stickersData ? JSON.parse(stickersData) : {};
  const sticker = stickers[stickerId];
  
    if (!sticker) {
      throw new Error('Sticker not found');
    }

    // Eliminar archivo
    await FileSystem.deleteAsync(sticker.uri, { idempotent: true });

    // Eliminar de metadatos
    delete stickers[stickerId];
    await AsyncStorage.setItem(STICKERS_KEY, JSON.stringify(stickers));

    // Eliminar del pack
    if (sticker.packId) {
      const packsData = await AsyncStorage.getItem(PACKS_KEY);
      const packs: StickerPack[] = packsData ? JSON.parse(packsData) : [];

      const packIndex = packs.findIndex((pack) => pack.id === sticker.packId);
      if (packIndex !== -1) {
        packs[packIndex].stickerIds = packs[packIndex].stickerIds.filter(
          (id) => id !== stickerId
        );
        await AsyncStorage.setItem(PACKS_KEY, JSON.stringify(packs));
      }
    }
  } catch (error) {
    console.error('Error deleting sticker:', error);
    throw error;
  }
}

/**
 * Elimina un pack y todos sus stickers
 */
export async function deletePack(packId: string): Promise<void> {
  try {
    const pack = await getPack(packId);
    if (!pack) {
      throw new Error('Pack not found');
    }

    // Eliminar todos los stickers del pack
    for (const stickerId of pack.stickerIds) {
      await deleteSticker(stickerId);
    }

    // Eliminar pack
    const packsData = await AsyncStorage.getItem(PACKS_KEY);
    const packs: StickerPack[] = packsData ? JSON.parse(packsData) : [];
    const updatedPacks = packs.filter((p) => p.id !== packId);
    await AsyncStorage.setItem(PACKS_KEY, JSON.stringify(updatedPacks));
  } catch (error) {
    console.error('Error deleting pack:', error);
    throw error;
  }
}
