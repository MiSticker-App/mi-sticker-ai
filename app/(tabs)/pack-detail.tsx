// app/(tabs)/pack-detail.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Trash2, Share2 } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import { StickerPreview } from '../../components/StickerPreview';
import { getPack, getPackStickers, deleteSticker } from '../../lib/stickerStorage';
import type { Sticker, StickerPack } from '../../types/sticker';

export default function PackDetailScreen() {
  const router = useRouter();
  const { packId } = useLocalSearchParams<{ packId: string }>();
  const [pack, setPack] = useState<StickerPack | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadPackData = async () => {
    if (!packId) return;

    try {
      const loadedPack = await getPack(packId);
      const loadedStickers = await getPackStickers(packId);
      setPack(loadedPack);
      setStickers(loadedStickers);
    } catch (error) {
      console.error('Error loading pack data:', error);
      Alert.alert('Error', 'No se pudo cargar el pack');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPackData();
    setRefreshing(false);
  };

  const handleDeleteSticker = (stickerId: string) => {
    Alert.alert(
      'Eliminar Sticker',
      '¿Estás seguro de que quieres eliminar este sticker?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSticker(stickerId);
              await loadPackData();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el sticker');
            }
          },
        },
      ]
    );
  };

  const exportToWhatsApp = async () => {
    Alert.alert('Export', 'WhatsApp export functionality coming soon!');
  };

  useEffect(() => {
    loadPackData();
  }, [packId]);

  const renderSticker = ({ item }: { item: Sticker }) => (
    <TouchableOpacity
      onLongPress={() => handleDeleteSticker(item.id)}
      className="flex-1 m-2"
      activeOpacity={0.8}
    >
      <View className="aspect-square rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 relative">
        <StickerPreview imageUrl={item.uri} className="w-full h-full border-0" />
        <View className="absolute top-2 right-2">
          <View className="w-8 h-8 rounded-full bg-red-500 items-center justify-center opacity-0">
            <Trash2 size={16} color="#fff" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!pack) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-zinc-500">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <View className="p-6 border-b border-zinc-800">
        <View className="flex-row items-center gap-3 mb-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-zinc-900 items-center justify-center"
            activeOpacity={0.8}
          >
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold flex-1">{pack.name}</Text>
        </View>
        <Text className="text-zinc-400 text-sm ml-13">{stickers.length} stickers</Text>
      </View>

      <FlatList
        data={stickers}
        renderItem={renderSticker}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />
        }
      />

      <View className="p-6 border-t border-zinc-800">
        <TouchableOpacity
          onPress={exportToWhatsApp}
          className="w-full py-4 rounded-2xl bg-green-500 items-center justify-center"
          activeOpacity={0.8}
        >
          <View className="flex-row items-center gap-2">
            <Share2 size={20} color="#fff" />
            <Text className="text-white font-bold text-lg">Export to WhatsApp</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
