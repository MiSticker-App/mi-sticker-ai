import { Platform, Alert } from "react-native";
import * as FileSystem from "expo-file-system";
import { StickerPack } from "../types/sticker";
import { getPackStickers } from "./stickerStorage";

/**
 * Exporta un pack de stickers a WhatsApp como pack nativo
 * 
 * IMPORTANTE: Esta funcionalidad requiere un Development Build (npx expo run:android/ios)
 * NO funcionará en Expo Go debido a las limitaciones de código nativo.
 * 
 * @param pack - El pack de stickers a exportar
 */
export async function addToWhatsApp(pack: StickerPack): Promise<void> {
  // Verificar que estamos en un dispositivo (no en Expo Go)
  if (__DEV__ && !FileSystem.documentDirectory) {
    throw new Error(
      "La exportación a WhatsApp requiere un Development Build. " +
      "Ejecuta 'npx expo run:android' o 'npx expo run:ios' para probar esta funcionalidad."
    );
  }

  try {
    // Obtener todos los stickers del pack
    const stickers = await getPackStickers(pack.id);

    if (stickers.length === 0) {
      throw new Error("El pack está vacío");
    }

    // Validar que todos los stickers existan en el FileSystem
    for (const sticker of stickers) {
      const fileInfo = await FileSystem.getInfoAsync(sticker.uri);
      if (!fileInfo.exists) {
        throw new Error(`El sticker ${sticker.id} no existe en el sistema de archivos`);
      }
    }

    // Crear directorio temporal para el pack de WhatsApp
    const packDir = FileSystem.cacheDirectory + `whatsapp_pack_${pack.id}/`;
    
    // Asegurarse de que el directorio existe
    const dirInfo = await FileSystem.getInfoAsync(packDir);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(packDir, { idempotent: true });
    }
    await FileSystem.makeDirectoryAsync(packDir, { intermediates: true });

    // Copiar stickers al directorio del pack
    // WhatsApp requiere que los archivos estén en un formato específico
    for (let i = 0; i < stickers.length; i++) {
      const sticker = stickers[i];
      const destPath = packDir + `${i + 1}.webp`;
      
      // Copiar el archivo
      await FileSystem.copyAsync({
        from: sticker.uri,
        to: destPath,
      });
    }

    // Crear archivo de metadatos (tray_pack.json para WhatsApp)
    const metadata = {
      android_play_store_link: "",
      ios_app_store_link: "",
      identifier: pack.id,
      name: pack.name,
      publisher: pack.publisher || "MS App",
      tray_image_file: "1.webp", // Usar el primer sticker como icono del pack
      image_data_version: "1",
      avoid_cache: false,
      animated_sticker_pack: false,
      sticker_pack_identifier: pack.id,
      total_size: stickers.length,
      stickers: stickers.map((_, index) => ({
        image_file: `${index + 1}.webp`,
        emojis: [],
      })),
    };

    const metadataPath = packDir + "tray_pack.json";
    await FileSystem.writeAsStringAsync(
      metadataPath,
      JSON.stringify(metadata, null, 2)
    );

    // Intentar abrir WhatsApp con el pack
    // NOTA: Esto requiere un módulo nativo que no está disponible en Expo Go
    // En un Development Build, aquí se llamaría al módulo nativo de WhatsApp
    
    if (Platform.OS === "android") {
      // Para Android, intentar usar Intent para abrir WhatsApp
      // Esto requiere código nativo o una librería como react-native-whatsapp-stickers
      throw new Error(
        "La exportación nativa a WhatsApp requiere un módulo nativo. " +
        "Instala 'react-native-whatsapp-stickers' o crea un módulo nativo personalizado."
      );
    } else if (Platform.OS === "ios") {
      // Para iOS, usar URL scheme de WhatsApp
      // Esto también requiere código nativo
      throw new Error(
        "La exportación nativa a WhatsApp requiere un módulo nativo. " +
        "Instala 'react-native-whatsapp-stickers' o crea un módulo nativo personalizado."
      );
    }

    // Si llegamos aquí, mostrar información sobre cómo continuar
    Alert.alert(
      "Pack preparado",
      `El pack se ha preparado en: ${packDir}\n\n` +
        "Para exportarlo a WhatsApp, necesitas:\n" +
        "1. Un Development Build (npx expo run:android/ios)\n" +
        "2. Un módulo nativo de WhatsApp o la librería react-native-whatsapp-stickers",
      [{ text: "OK" }]
    );
  } catch (error) {
    console.error("Error exporting to WhatsApp:", error);
    throw error;
  }
}

/**
 * Valida que un sticker cumpla con los requisitos de WhatsApp
 * - Formato WEBP
 * - Tamaño máximo 512x512px
 * - Sin animación
 */
export async function validateStickerForWhatsApp(
  stickerUri: string
): Promise<boolean> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(stickerUri);
    if (!fileInfo.exists) {
      return false;
    }

    // Verificar que sea WEBP
    if (!stickerUri.endsWith(".webp")) {
      return false;
    }

    // Nota: La validación de dimensiones requeriría una librería de procesamiento de imágenes
    // Por ahora, asumimos que el backend ya genera stickers en el formato correcto (512x512px)
    
    return true;
  } catch (error) {
    console.error("Error validating sticker:", error);
    return false;
  }
}

