import { useState, useEffect } from "react";
import { View, Text, FlatList, Image, Pressable, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Share2 } from "lucide-react-native";
import { Button } from "../../components/Button";
import { Sticker, StickerPack } from "../../types/sticker";
import {
  getPacks,
  getPackStickers,
  deleteSticker,
} from "../../lib/stickerStorage";
import { addToWhatsApp } from "../../lib/whatsappExporter";

export default function PackDetailScreen() {
  const { packId } = useLocalSearchParams<{ packId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [pack, setPack] = useState<StickerPack | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (packId) {
      loadPackData();
    }
  }, [packId]);

  const loadPackData = async () => {
    if (!packId) return;

    try {
      const packs = await getPacks();
      const foundPack = packs.find((p) => p.id === packId);
      
      if (foundPack) {
        setPack(foundPack);
        const packStickers = await getPackStickers(packId);
        setStickers(packStickers);
      } else {
        Alert.alert("Error", "Pack no encontrado");
        router.back();
      }
    } catch (error) {
      console.error("Error loading pack data:", error);
      Alert.alert("Error", "No se pudo cargar el pack");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToWhatsApp = async () => {
    if (!pack) {
      Alert.alert("Error", "No hay pack para exportar");
      return;
    }

    if (stickers.length === 0) {
      Alert.alert("Error", "El pack está vacío");
      return;
    }

    setIsExporting(true);
    try {
      await addToWhatsApp(pack);
      Alert.alert(
        "Éxito",
        "Pack exportado a WhatsApp. Abre WhatsApp para añadirlo a tus stickers."
      );
    } catch (error) {
      console.error("Error exporting to WhatsApp:", error);
      Alert.alert(
        "Error",
        "No se pudo exportar el pack. Asegúrate de tener WhatsApp instalado y de usar un Development Build."
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteSticker = async (stickerId: string) => {
    Alert.alert(
      "Eliminar sticker",
      "¿Estás seguro de que quieres eliminar este sticker?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSticker(stickerId);
              await loadPackData();
            } catch (error) {
              console.error("Error deleting sticker:", error);
              Alert.alert("Error", "No se pudo eliminar el sticker");
            }
          },
        },
      ]
    );
  };

  const renderSticker = ({ item }: { item: Sticker }) => (
    <Pressable
      onLongPress={() => handleDeleteSticker(item.id)}
      className="flex-1 m-1 aspect-square"
    >
      <View className="flex-1 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-700">
        <Image
          source={{ uri: item.uri }}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View
        className="flex-1 bg-black items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-zinc-400">Cargando pack...</Text>
      </View>
    );
  }

  if (!pack) {
    return (
      <View
        className="flex-1 bg-black items-center justify-center px-4"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-white text-lg mb-4">Pack no encontrado</Text>
        <Button onPress={() => router.back()}>Volver</Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <ArrowLeft size={24} color="#ffffff" />
        </Pressable>
        <Text className="text-white text-xl font-bold flex-1 text-center">
          {pack.name}
        </Text>
        <View className="w-10" />
      </View>

      <View className="px-4 pb-4">
        <Text className="text-zinc-400 text-sm text-center">
          {stickers.length} {stickers.length === 1 ? "sticker" : "stickers"}
        </Text>
      </View>

      {stickers.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-zinc-400 text-center">
            Este pack está vacío
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={stickers}
            renderItem={renderSticker}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={{ padding: 4 }}
            showsVerticalScrollIndicator={false}
            onRefresh={loadPackData}
            refreshing={isLoading}
          />

          <View className="px-4 pb-4 pt-2 border-t border-zinc-800">
            <Button
              onPress={handleExportToWhatsApp}
              loading={isExporting}
              disabled={isExporting || stickers.length === 0}
              className="w-full"
            >
              <View className="flex-row items-center gap-2">
                <Share2 size={20} color="#000000" />
                <Text className="text-black font-bold">
                  Exportar a WhatsApp
                </Text>
              </View>
            </Button>
            <Text className="text-zinc-500 text-xs text-center mt-2">
              Mantén presionado un sticker para eliminarlo
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

