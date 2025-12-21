import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  Pressable,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Sparkles, Camera } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Button } from "../../components/Button";
import { useDailyLimit } from "../../hooks/useDailyLimit";
import { api } from "../../lib/api";
import { cn } from "../../lib/utils";
import { useAds, showInterstitial, showRewardedAd } from "../../hooks/useAds";
import * as FileSystem from "expo-file-system";

export default function CreateScreen() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingMagic, setIsLoadingMagic] = useState(false);
  const { remaining, limit, canUse, consume, addCredits } = useDailyLimit();
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  
  // Inicializar AdMob
  useAds();

  const handlePickImage = async () => {
    try {
      // Solicitar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permisos necesarios",
          "Necesitamos acceso a tu galería para seleccionar una imagen."
        );
        return;
      }

      // Abrir selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error seleccionando imagen:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen");
    }
  };

  const handleGenerate = async () => {
    // Validar prompt e imagen
    if (!prompt.trim()) {
      Alert.alert("Error", "Por favor ingresa un texto para el sticker");
      return;
    }

    if (!selectedImageUri) {
      Alert.alert("Error", "Por favor selecciona una imagen");
      return;
    }

    if (!canUse()) {
      Alert.alert(
        "Límite alcanzado",
        "Has alcanzado tu límite diario de 5 generaciones. Vuelve mañana."
      );
      return;
    }

    setIsGenerating(true);
    try {
      const consumed = await consume();
      if (!consumed) {
        Alert.alert("Error", "No se pudo registrar el uso. Intenta de nuevo.");
        setIsGenerating(false);
        return;
      }

      // Preparar anuncio en background mientras se hace la llamada API
      const adPromise = showInterstitial();

      // Llamar a API /generate/meme con FormData
      const response = await api.generateMeme(prompt, selectedImageUri);

      // Guardar base64 en archivo temporal usando FileSystem
      const fileName = `sticker_temp_${Date.now()}.webp`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      
      // El backend devuelve base64 sin el prefijo data:image/webp;base64,
      // así que lo añadimos si no está presente
      let base64String = response.image_base64;
      if (!base64String.startsWith("data:")) {
        base64String = `data:image/webp;base64,${base64String}`;
      }

      // Extraer solo el base64 sin el prefijo para guardarlo
      const base64Data = base64String.includes(",")
        ? base64String.split(",")[1]
        : base64String;

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Mostrar Interstitial Ad
      await adPromise;

      // Navegar a pantalla de resultado con la URI del archivo
      router.push({
        pathname: "/(tabs)/result",
        params: { imageUri: fileUri },
      });
    } catch (error) {
      console.error("Error generating sticker:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "No se pudo generar el sticker. Verifica que el backend esté corriendo."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMagicText = async () => {
    const context = prompt.trim() || "Gato mirando de reojo";
    setIsLoadingMagic(true);
    try {
      const response = await api.generateText(context);
      setPrompt(response.text);
    } catch (error) {
      console.error("Error getting magic text:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "No se pudo generar el texto mágico. Verifica que el backend esté corriendo."
      );
    } finally {
      setIsLoadingMagic(false);
    }
  };

  const handleWatchRewardedAd = async () => {
    setIsWatchingAd(true);
    try {
      const rewarded = await showRewardedAd();
      if (rewarded) {
        // Añadir +2 créditos cuando el usuario completa el anuncio
        const success = await addCredits(2);
        if (success) {
          Alert.alert(
            "¡Créditos añadidos!",
            "Has recibido 2 créditos adicionales por ver el video."
          );
        } else {
          Alert.alert("Error", "No se pudieron añadir los créditos. Intenta de nuevo.");
        }
      } else {
        Alert.alert(
          "Anuncio no completado",
          "Debes ver el anuncio completo para recibir los créditos."
        );
      }
    } catch (error) {
      console.error("Error showing rewarded ad:", error);
      Alert.alert("Error", "No se pudo mostrar el anuncio. Intenta de nuevo.");
    } finally {
      setIsWatchingAd(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-black"
      contentContainerClassName="flex-1 px-4 pt-8 pb-24"
    >
      <View className="flex-1 items-center justify-start">
        <Text className="text-white text-3xl font-bold mb-8">Create</Text>

        {/* Preview de imagen seleccionada o placeholder */}
        {selectedImageUri ? (
          <View className="w-full max-w-sm aspect-square bg-zinc-900 border border-zinc-700 rounded-3xl items-center justify-center overflow-hidden mb-6">
            <Image
              source={{ uri: selectedImageUri }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
        ) : (
          <Pressable
            onPress={handlePickImage}
            className="w-full max-w-sm aspect-square bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-3xl items-center justify-center mb-6"
          >
            <Camera size={48} color="#71717a" />
            <Text className="text-zinc-500 text-lg mt-4">Subir Foto</Text>
          </Pressable>
        )}

        <View className="w-full max-w-sm mb-4">
          <View className="flex-row items-center gap-2">
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              placeholder="Describe tu sticker..."
              placeholderTextColor="#a1a1aa"
              className="flex-1 bg-zinc-900 text-white rounded-xl px-4 py-3 border border-zinc-800"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <Pressable
              onPress={handleMagicText}
              disabled={isLoadingMagic}
              className={cn(
                "w-12 h-12 rounded-full bg-zinc-800 items-center justify-center",
                isLoadingMagic && "opacity-50"
              )}
            >
              <Sparkles
                size={24}
                color={isLoadingMagic ? "#71717a" : "#ffffff"}
              />
            </Pressable>
          </View>
        </View>

        {/* Botón para seleccionar imagen si no hay una seleccionada */}
        {!selectedImageUri && (
          <View className="w-full max-w-sm mb-4">
            <Pressable
              onPress={handlePickImage}
              className="w-full rounded-full px-6 py-3 bg-zinc-800 items-center justify-center flex-row gap-2"
            >
              <Camera size={20} color="#ffffff" />
              <Text className="text-white font-bold">Subir Foto</Text>
            </Pressable>
          </View>
        )}

        <View className="w-full max-w-sm mb-4">
          {!canUse() ? (
            <Button
              onPress={handleWatchRewardedAd}
              disabled={isWatchingAd}
              loading={isWatchingAd}
              className="w-full"
            >
              Ver Video para Desbloquear
            </Button>
          ) : (
            <Button
              onPress={handleGenerate}
              disabled={!prompt.trim() || !selectedImageUri || isGenerating}
              loading={isGenerating}
              className="w-full"
            >
              Generate Sticker
            </Button>
          )}
        </View>

        <Text className="text-zinc-400 text-xs text-center">
          {remaining}/{limit} free boosts left
        </Text>
      </View>
    </ScrollView>
  );
}
