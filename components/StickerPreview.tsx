import { View, Image, Text } from "react-native";
import { cn } from "../lib/utils";

interface StickerPreviewProps {
  imageUrl?: string | null;
  className?: string;
}

export function StickerPreview({ imageUrl, className }: StickerPreviewProps) {
  return (
    <View
      className={cn(
        "w-full max-w-sm aspect-square bg-zinc-900 border border-zinc-700 rounded-3xl items-center justify-center overflow-hidden",
        className
      )}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-full"
          resizeMode="contain"
        />
      ) : (
        <Text className="text-zinc-500 text-lg">Preview</Text>
      )}
    </View>
  );
}

