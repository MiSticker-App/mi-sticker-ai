// components/StickerPreview.tsx
import React from 'react';
import { View, Image, Text, type ViewProps } from 'react-native';
import { cn } from '../lib/utils';

interface StickerPreviewProps extends ViewProps {
  imageUrl?: string | null;
}

export function StickerPreview({
  imageUrl,
  className,
  ...props
}: StickerPreviewProps) {
  return (
    <View
      className={cn(
        'aspect-square rounded-3xl bg-zinc-900 border-2 border-zinc-700 items-center justify-center overflow-hidden',
        className
      )}
      {...props}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-full"
          resizeMode="cover"
        />
      ) : (
        <Text className="text-zinc-600 text-sm">Preview</Text>
      )}
    </View>
  );
}
