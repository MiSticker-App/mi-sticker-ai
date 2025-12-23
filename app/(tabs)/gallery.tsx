// app/(tabs)/gallery.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, Grid as GridIcon } from 'lucide-react-native';
import { StickerPreview } from '../../components/StickerPreview';
import { getPacks, getPackStickers, createManualPack } from '../../lib/stickerStorage';
import type { StickerPack } from '../../types/sticker';

interface PackWithPreview extends StickerPack {
  previewUri?: string | null;
}

function PackItem({ item, onPress }: { item: PackWithPreview; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 m-2"
      activeOpacity={0.8}
    >
      <View className="aspect-square rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800">
        <StickerPreview imageUrl={item.previewUri} className="w-full h-full border-0" />
        <View className="absolute bottom-0 left-0 right-0 bg-black/70 p-4">
          <Text className="text-white font-bold truncate">{item.name}</Text>
          <Text className="text-zinc-400 text-sm">
            {item.stickerIds.length} stickers
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function GalleryScreen() {
  const router = useRouter();
  const [packs, setPacks] = useState<PackWithPreview[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewPackModal, setShowNewPackModal] = useState(false);
  const [newPackName, setNewPackName] = useState('');

  const loadPacks = async () => {
    try {
      const loadedPacks = await getPacks();
      // Cargar previews para cada pack
      const packsWithPreviews: PackWithPreview[] = await Promise.all(
        loadedPacks.map(async (pack) => {
          if (pack.stickerIds.length > 0) {
            const stickers = await getPackStickers(pack.id);
          return {
            ...pack,
              previewUri: stickers[0]?.uri || null,
          };
          }
          return { ...pack, previewUri: null };
        })
      );
      setPacks(packsWithPreviews);
    } catch (error) {
      console.error('Error loading packs:', error);
      Alert.alert('Error', 'No se pudieron cargar los packs');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPacks();
    setRefreshing(false);
  };

  const createPack = async () => {
    if (!newPackName.trim()) {
      Alert.alert('Atención', 'Escribe un nombre para el pack');
      return;
    }

    try {
      await createManualPack(newPackName.trim());
      setShowNewPackModal(false);
      setNewPackName('');
      await loadPacks();
    } catch (error) {
      console.error('Error creating pack:', error);
      Alert.alert('Error', 'No se pudo crear el pack');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPacks();
    }, [])
  );

  const renderPack = ({ item }: { item: PackWithPreview }) => (
    <PackItem
      item={item}
      onPress={() => router.push(`/(tabs)/pack-detail?packId=${item.id}`)}
    />
  );

  return (
    <View className="flex-1 bg-black">
      <View className="p-6 border-b border-zinc-900">
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-2xl font-bold">My Packs</Text>
          <TouchableOpacity
            onPress={() => setShowNewPackModal(true)}
            className="w-12 h-12 rounded-full bg-purple-500 items-center justify-center"
            activeOpacity={0.8}
          >
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={packs}
        renderItem={renderPack}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <GridIcon size={64} color="#3f3f46" />
            <Text className="text-zinc-500 text-lg mt-4">No packs yet</Text>
            <Text className="text-zinc-600 text-sm mt-2">Create stickers to build your collection</Text>
          </View>
        }
      />

      {/* New Pack Modal */}
      <Modal
        visible={showNewPackModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewPackModal(false)}
      >
        <View className="flex-1 bg-black/80 items-center justify-center p-6">
          <View className="bg-zinc-900 rounded-3xl p-6 w-full max-w-md border border-zinc-800">
            <Text className="text-white text-xl font-bold mb-4">New Pack</Text>
          <TextInput
            value={newPackName}
            onChangeText={setNewPackName}
              placeholder="Pack name..."
              placeholderTextColor="#52525b"
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 border border-zinc-700 mb-4"
            autoFocus
          />
            <View className="flex-row gap-3">
              <TouchableOpacity
              onPress={() => {
                  setShowNewPackModal(false);
                  setNewPackName('');
                }}
                className="flex-1 py-3 rounded-xl bg-zinc-800 items-center"
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={createPack}
                className="flex-1 py-3 rounded-xl bg-purple-500 items-center"
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold">Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
