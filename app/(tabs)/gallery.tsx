import { useState, useEffect } from "react";
import { View, Text, FlatList, Image, Pressable, Alert, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StickerPack, Sticker } from "../../types/sticker";
import { getPacks, getPackStickers, createManualPack } from "../../lib/stickerStorage";
import { Plus } from "lucide-react-native";

interface PackWithPreview extends StickerPack {
  previewUri?: string;
  stickerCount: number;
}

export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [packs, setPacks] = useState<PackWithPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatePack, setShowCreatePack] = useState(false);
  const [newPackName, setNewPackName] = useState("");

  useEffect(() => {
    loadPacks();
  }, []);

  const loadPacks = async () => {
    try {
      const loadedPacks = await getPacks();
      // Ordenar por fecha (más recientes primero)
      loadedPacks.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Cargar previews y contadores para cada pack
      const packsWithPreviews: PackWithPreview[] = await Promise.all(
        loadedPacks.map(async (pack) => {
          const packStickers = await getPackStickers(pack.id);
          const firstSticker = packStickers[0];
          return {
            ...pack,
            previewUri: firstSticker?.uri,
            stickerCount: packStickers.length,
          };
        })
      );
      
      setPacks(packsWithPreviews);
    } catch (error) {
      console.error("Error loading packs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePackPress = (packId: string) => {
    router.push({
      pathname: "/(tabs)/pack-detail",
      params: { packId },
    });
  };

  const handleCreatePack = async () => {
    if (!newPackName.trim()) {
      Alert.alert("Error", "Por favor ingresa un nombre para el pack");
      return;
    }

    try {
      await createManualPack(newPackName.trim());
      setNewPackName("");
      setShowCreatePack(false);
      await loadPacks();
      Alert.alert("Éxito", "Pack creado correctamente");
    } catch (error) {
      console.error("Error creating pack:", error);
      Alert.alert("Error", "No se pudo crear el pack");
    }
  };

  const renderPackItem = ({ item }: { item: PackWithPreview }) => {
    return (
      <Pressable
        onPress={() => handlePackPress(item.id)}
        className="flex-1 m-2"
        style={{ minWidth: "45%" }}
      >
        <View className="aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-700">
          {item.previewUri ? (
        <Image
              source={{ uri: item.previewUri }}
          className="w-full h-full"
          resizeMode="cover"
        />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Text className="text-zinc-500 text-sm">Vacío</Text>
            </View>
          )}
          <View className="absolute bottom-0 left-0 right-0 bg-black/70 px-3 py-2">
            <Text className="text-white font-bold text-sm" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-zinc-400 text-xs">
              {item.stickerCount} {item.stickerCount === 1 ? "sticker" : "stickers"}
            </Text>
          </View>
      </View>
    </Pressable>
  );
  };

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <Text className="text-white text-3xl font-bold">Mis Stickers</Text>
        <Pressable
          onPress={() => setShowCreatePack(true)}
          className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center"
        >
          <Plus size={24} color="#ffffff" />
        </Pressable>
      </View>

      {showCreatePack && (
        <View className="px-4 py-4 bg-zinc-900 border-b border-zinc-800">
          <TextInput
            value={newPackName}
            onChangeText={setNewPackName}
            placeholder="Nombre del pack"
            placeholderTextColor="#a1a1aa"
            className="bg-zinc-800 text-white rounded-xl px-4 py-3 mb-3"
            autoFocus
          />
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => {
                setShowCreatePack(false);
                setNewPackName("");
              }}
              className="flex-1 bg-zinc-700 rounded-xl px-4 py-3 items-center"
            >
              <Text className="text-white font-bold">Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={handleCreatePack}
              className="flex-1 bg-white rounded-xl px-4 py-3 items-center"
            >
              <Text className="text-black font-bold">Crear</Text>
            </Pressable>
          </View>
        </View>
      )}

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-zinc-400">Cargando packs...</Text>
        </View>
      ) : packs.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-zinc-400 text-center mb-4">
            No tienes packs todavía
          </Text>
          <Text className="text-zinc-500 text-sm text-center">
            Crea stickers para generar packs automáticamente
          </Text>
        </View>
      ) : (
      <FlatList
          data={packs}
          renderItem={renderPackItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 4 }}
        showsVerticalScrollIndicator={false}
          onRefresh={loadPacks}
          refreshing={isLoading}
      />
      )}
    </View>
  );
}
