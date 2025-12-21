import { useState, useEffect } from "react";
import { View, Text, Image, ScrollView, Pressable, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { ArrowLeft, Share2 } from "lucide-react-native";
import { Button } from "../../components/Button";
import {
  saveSticker,
  getOrCreateTodayPack,
  addStickerToPack,
} from "../../lib/stickerStorage";

export default function ResultScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Guardar sticker permanentemente cuando se carga la pantalla
  useEffect(() => {
    if (imageUri && !isSaved) {
      saveStickerPermanently();
    }
  }, [imageUri]);

  const saveStickerPermanently = async () => {
    if (!imageUri || isSaving || isSaved) return;

    setIsSaving(true);
    try {
      // Leer el archivo desde cache
      const base64Data = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Obtener o crear el pack del día
      const todayPack = await getOrCreateTodayPack();

      // Guardar sticker permanentemente
      const sticker = await saveSticker(base64Data, todayPack.id);

      // Añadir al pack
      await addStickerToPack(sticker.id, todayPack.id);

      setIsSaved(true);
    } catch (error) {
      console.error("Error saving sticker permanently:", error);
      // No mostrar error al usuario, solo loguear
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!imageUri) {
      Alert.alert("Error", "No hay imagen para compartir");
      return;
    }

    try {
      // Verificar si Sharing está disponible
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (!isAvailable) {
        Alert.alert(
          "No disponible",
          "La función de compartir no está disponible en este dispositivo"
        );
        return;
      }

      // Compartir el archivo usando expo-sharing
      // Esto abrirá el selector nativo del sistema (WhatsApp, etc.)
      await Sharing.shareAsync(imageUri, {
        mimeType: "image/webp",
        dialogTitle: "Compartir sticker",
        UTI: "public.webp", // iOS: Uniform Type Identifier para WebP
      });
    } catch (error) {
      console.error("Error compartiendo:", error);
      Alert.alert("Error", "No se pudo compartir la imagen");
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (!imageUri) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-4">
        <Text className="text-white text-lg mb-4">No se encontró la imagen</Text>
        <Button onPress={handleGoBack}>Volver</Button>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-black"
      contentContainerClassName="flex-1 px-4 pt-8 pb-24"
    >
      <View className="flex-1 items-center justify-start">
        <View className="w-full flex-row items-center justify-between mb-6">
          <Pressable
            onPress={handleGoBack}
            className="w-10 h-10 items-center justify-center"
          >
            <ArrowLeft size={24} color="#ffffff" />
          </Pressable>
          <Text className="text-white text-3xl font-bold">Resultado</Text>
          <Pressable
            onPress={handleShare}
            className="w-10 h-10 items-center justify-center"
          >
            <Share2 size={24} color="#ffffff" />
          </Pressable>
        </View>

        <View className="w-full max-w-sm aspect-square bg-zinc-900 border border-zinc-700 rounded-3xl items-center justify-center overflow-hidden mb-6">
          <Image
            source={{ uri: imageUri }}
            className="w-full h-full"
            resizeMode="contain"
          />
        </View>

        <View className="w-full max-w-sm gap-4">
          <Button onPress={handleShare} className="w-full">
            Compartir en WhatsApp
          </Button>
          <Button onPress={handleGoBack} variant="outline" className="w-full">
            Crear Otro Sticker
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

