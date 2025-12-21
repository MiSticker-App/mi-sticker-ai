import { Pressable, Text, ActivityIndicator } from "react-native";
import { cn } from "../lib/utils";

interface ButtonProps {
  variant?: "primary" | "secondary" | "outline";
  onPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button({
  variant = "primary",
  onPress,
  children,
  disabled = false,
  loading = false,
  className,
}: ButtonProps) {
  const baseClasses = "rounded-full px-6 py-3 font-bold items-center justify-center";
  const variantClasses =
    variant === "primary"
      ? "bg-white text-black"
      : variant === "outline"
      ? "bg-transparent border-2 border-white text-white"
      : "bg-zinc-800 text-white";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        baseClasses,
        variantClasses,
        (disabled || loading) && "opacity-50",
        className
      )}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#000000" : "#ffffff"}
          size="small"
        />
      ) : (
        <Text
          className={cn(
            "font-bold",
            variant === "primary" ? "text-black" : "text-white"
          )}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

