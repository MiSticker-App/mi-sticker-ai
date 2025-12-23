// hooks/useDailyLimit.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DailyLimit } from '../types/sticker';

const DAILY_LIMIT_KEY = '@misticker:daily_limit';
const MAX_GENERATIONS = 5;

/**
 * Hook para manejar el límite diario de generaciones de stickers
 */
export function useDailyLimit() {
  const [limit] = useState(MAX_GENERATIONS);
  const [remaining, setRemaining] = useState(MAX_GENERATIONS);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Carga el límite actual desde AsyncStorage
   */
  const loadLimit = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(DAILY_LIMIT_KEY);
      
      if (!data) {
        // Primera vez, inicializar con límite completo
        await resetLimit();
        setRemaining(MAX_GENERATIONS);
        return;
      }

      const limitData: DailyLimit = JSON.parse(data);
      const lastResetDate = new Date(limitData.lastResetDate);
      const today = new Date();

      // Verificar si necesitamos resetear (nuevo día)
      const needsReset =
        lastResetDate.getDate() !== today.getDate() ||
        lastResetDate.getMonth() !== today.getMonth() ||
        lastResetDate.getFullYear() !== today.getFullYear();

      if (needsReset) {
        await resetLimit();
        setRemaining(MAX_GENERATIONS);
      } else {
        setRemaining(MAX_GENERATIONS - limitData.generationsCount);
      }
    } catch (error) {
      console.error('Error loading daily limit:', error);
      setRemaining(MAX_GENERATIONS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Resetea el límite diario
   */
  const resetLimit = async () => {
    try {
      const newLimitData: DailyLimit = {
        generationsCount: 0,
        lastResetDate: new Date().toISOString(),
      };
      await AsyncStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(newLimitData));
    } catch (error) {
      console.error('Error resetting limit:', error);
      throw error;
    }
  };

  /**
   * Verifica si el usuario puede usar una generación
   */
  const canUse = useCallback((): boolean => {
    return remaining > 0;
  }, [remaining]);

  /**
   * Consume un crédito de generación
   */
  const consume = useCallback(async (): Promise<boolean> => {
    if (remaining <= 0) {
      return false;
    }

    try {
      const data = await AsyncStorage.getItem(DAILY_LIMIT_KEY);
      const limitData: DailyLimit = data
        ? JSON.parse(data)
        : { generationsCount: 0, lastResetDate: new Date().toISOString() };

      limitData.generationsCount += 1;
      await AsyncStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(limitData));
      
      setRemaining(Math.max(0, MAX_GENERATIONS - limitData.generationsCount));
      return true;
    } catch (error) {
      console.error('Error consuming credit:', error);
      return false;
    }
  }, [remaining]);

  /**
   * Añade créditos adicionales (usado por Rewarded Ads)
   */
  const addCredits = useCallback(async (amount: number): Promise<void> => {
    try {
      const data = await AsyncStorage.getItem(DAILY_LIMIT_KEY);
      const limitData: DailyLimit = data
        ? JSON.parse(data)
        : { generationsCount: 0, lastResetDate: new Date().toISOString() };

      // Reducir el contador de generaciones (pero no por debajo de 0)
      limitData.generationsCount = Math.max(0, limitData.generationsCount - amount);
      await AsyncStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(limitData));
      
      setRemaining(Math.min(MAX_GENERATIONS, MAX_GENERATIONS - limitData.generationsCount));
      } catch (error) {
      console.error('Error adding credits:', error);
      throw error;
    }
  }, []);

  // Cargar límite al montar el componente
  useEffect(() => {
    loadLimit();
  }, [loadLimit]);

  return {
    limit,
    remaining,
    isLoading,
    canUse,
    consume,
    addCredits,
    reload: loadLimit,
  };
}
