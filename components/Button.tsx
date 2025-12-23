// components/Button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  type TouchableOpacityProps,
} from 'react-native';
import { cn } from '../lib/utils';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      disabled={isDisabled}
      className={cn(
        'px-6 py-4 rounded-2xl items-center justify-center',
        variant === 'primary' && 'bg-white',
        variant === 'secondary' && 'bg-zinc-800',
        variant === 'outline' && 'bg-transparent border-2 border-white',
        isDisabled && 'opacity-50',
        className
      )}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#000000' : '#ffffff'}
        />
      ) : (
        <Text
          className={cn(
            'font-bold text-lg',
            variant === 'primary' && 'text-black',
            variant === 'secondary' && 'text-white',
            variant === 'outline' && 'text-white'
          )}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}
