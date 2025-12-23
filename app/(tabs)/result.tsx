// app/(tabs)/result.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Share2 } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import { StickerPreview } from '../../components/StickerPreview';

export default function ResultScreen() {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();

  const shareToWhatsApp = async () => {
    if (!imageUri) return;

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(imageUri, {
        mimeType: 'image/webp',
        dialogTitle: 'Share your sticker',
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Could not share the sticker');
    }
  };

  return (
    <View className="flex-1 bg-black items-center justify-center p-6">
      <View className="w-80 h-80 rounded-3xl overflow-hidden bg-zinc-900 border-2 border-purple-500 mb-6">
        <StickerPreview imageUrl={imageUri || null} className="w-full h-full border-0" />
      </View>

      <View className="w-full max-w-md gap-3">
        <TouchableOpacity
          onPress={shareToWhatsApp}
          className="w-full py-4 rounded-2xl bg-green-500 items-center justify-center mb-3"
          activeOpacity={0.8}
        >
          <View className="flex-row items-center gap-2">
            <Share2 size={20} color="#fff" />
            <Text className="text-white font-bold text-lg">Share to WhatsApp</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/create')}
          className="w-full py-4 rounded-2xl bg-zinc-800 items-center justify-center"
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-lg">Create Another</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
