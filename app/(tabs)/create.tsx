// app/(tabs)/create.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Sparkles, Upload, Wand2, Zap } from 'lucide-react-native';
import { Button } from '../../components/Button';
import { StickerPreview } from '../../components/StickerPreview';
import { useDailyLimit } from '../../hooks/useDailyLimit';
import { useAds } from '../../hooks/useAds';
import { api } from '../../lib/api';
import { saveSticker, getOrCreateTodayPack, addStickerToPack } from '../../lib/stickerStorage';

export default function CreateScreen() {
  const router = useRouter();
  const { remaining, limit, canUse, consume, addCredits } = useDailyLimit();
  const { showInterstitial, showRewardedAd } = useAds();

  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);

  /**
   * Selecciona una imagen de la galería
   */
  const selectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permiso Requerido',
          'Necesitamos acceso a tu galería para seleccionar imágenes'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  /**
   * Genera texto con IA
   */
  const generateText = async () => {
    if (!selectedImage) {
      Alert.alert('Atención', 'Primero selecciona una imagen');
      return;
    }

    setIsGeneratingText(true);
    try {
      const response = await api.generateText(
        'Generate a funny meme caption in Spanish'
      );
      setPrompt(response.text);
    } catch (error) {
      console.error('Error generating text:', error);
      Alert.alert('Error', 'No se pudo generar el texto');
    } finally {
      setIsGeneratingText(false);
    }
  };

  /**
   * Genera el sticker con IA
   */
  const generateSticker = async () => {
    if (!prompt.trim()) {
      Alert.alert('Atención', 'Escribe una descripción para tu sticker');
      return;
    }

    if (!selectedImage) {
      Alert.alert('Atención', 'Selecciona una imagen primero');
      return;
    }

    if (!canUse()) {
      Alert.alert(
        'Sin Créditos',
        'Has alcanzado el límite diario. Ve un video para desbloquear más créditos.'
      );
      return;
    }

    setIsGenerating(true);
    try {
      // Consumir crédito
      const consumed = await consume();
      if (!consumed) {
        Alert.alert('Error', 'No se pudo consumir el crédito');
        return;
      }

      // Generar sticker con la API
      const response = await api.generateMeme(prompt, selectedImage);

      if (!response.success || !response.image_base64) {
        throw new Error(response.message || 'Error al generar sticker');
      }

      // Guardar sticker localmente
      const todayPack = await getOrCreateTodayPack();
      const sticker = await saveSticker(response.image_base64, todayPack.id);
      await addStickerToPack(sticker.id, todayPack.id);

      // Mostrar anuncio intersticial
      await showInterstitial();

      // Navegar a resultado
      router.push({
        pathname: '/(tabs)/result',
        params: { imageUri: sticker.uri },
      });

      // Limpiar formulario
      setPrompt('');
      setSelectedImage(null);
    } catch (error) {
      console.error('Error generating sticker:', error);
      Alert.alert(
        'Error',
        'No se pudo generar el sticker. Verifica tu conexión e intenta nuevamente.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Desbloquea créditos viendo un anuncio con recompensa
   */
  const unlockCredits = async () => {
    try {
      const rewarded = await showRewardedAd();
      
      if (rewarded) {
        await addCredits(2);
        Alert.alert('¡Genial!', '¡Has desbloqueado 2 créditos adicionales! 🎉');
      }
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      Alert.alert('Error', 'No se pudo mostrar el anuncio');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, paddingTop: 16 }}
          keyboardShouldPersistTaps="handled"
        >
        {/* Credits Counter */}
        <View className="bg-zinc-900/80 rounded-2xl p-4 border border-zinc-800 mb-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-zinc-400 text-sm">Daily Free Boosts</Text>
            <View className="flex-row items-center gap-2">
              <Zap size={16} color="#a855f7" />
              <Text className="text-white font-bold">
                {remaining}/{limit}
              </Text>
            </View>
          </View>
        </View>

        {/* Image Selector */}
        <View className="mb-6">
          <Text className="text-zinc-400 text-sm mb-2">Select Image</Text>
          <TouchableOpacity
            onPress={selectImage}
            className="h-64 bg-zinc-900 rounded-3xl border-2 border-dashed border-zinc-700 items-center justify-center overflow-hidden"
            activeOpacity={0.8}
          >
            {selectedImage ? (
              <StickerPreview imageUrl={selectedImage} className="w-full h-full border-0" />
            ) : (
              <View className="items-center gap-2">
                <Upload size={48} color="#71717a" />
                <Text className="text-zinc-500 text-sm">Tap to select image</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Prompt Input */}
        <View className="mb-6">
          <Text className="text-zinc-400 text-sm mb-2">Describe your sticker</Text>
          <View className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-4">
            <View className="flex-row items-start gap-3">
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
                placeholder="Un gato con gafas de sol..."
                placeholderTextColor="#52525b"
                className="flex-1 text-white text-base min-h-[80px]"
              multiline
                maxLength={200}
                editable={!isGenerating}
              />
              <TouchableOpacity
                onPress={generateText}
                disabled={isGeneratingText || !selectedImage}
                className="w-10 h-10 rounded-full bg-purple-500 items-center justify-center"
                activeOpacity={0.8}
              >
                {isGeneratingText ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Wand2 size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Generate / Unlock Button */}
        {canUse() ? (
          <TouchableOpacity
            onPress={generateSticker}
            disabled={isGenerating}
            className="w-full py-4 rounded-2xl bg-purple-500 items-center justify-center mb-4"
            activeOpacity={0.8}
          >
            <View className="flex-row items-center gap-2">
              {isGenerating ? (
                <>
                  <ActivityIndicator color="#fff" />
                  <Text className="text-white font-bold text-lg">Generating...</Text>
                </>
              ) : (
                <>
                  <Sparkles size={20} color="#fff" />
                  <Text className="text-white font-bold text-lg">Generate Sticker</Text>
                </>
          )}
        </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={unlockCredits}
            className="w-full py-4 rounded-2xl bg-cyan-500 items-center justify-center mb-4"
            activeOpacity={0.8}
          >
            <View className="flex-row items-center gap-2">
              <Zap size={20} color="#fff" />
              <Text className="text-white font-bold text-lg">Watch Video to Unlock</Text>
      </View>
          </TouchableOpacity>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
