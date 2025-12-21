import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@misticker:daily_limit";
const LIMIT = 5;

interface DailyLimitData {
  generationsCount: number;
  lastResetDate: string; // ISO string format
}

export function useDailyLimit() {
  const [remaining, setRemaining] = useState(LIMIT);
  const [limit] = useState(LIMIT);
  const [resetAt, setResetAt] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isToday = useCallback((dateString: string): boolean => {
    const today = new Date();
    const date = new Date(dateString);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }, []);

  const getTodayISOString = useCallback((): string => {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  }, []);

  const loadLimit = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const today = getTodayISOString();

      if (!stored) {
        // Primera vez, inicializar
        const data: DailyLimitData = {
          generationsCount: 0,
          lastResetDate: today,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setRemaining(LIMIT);
        setResetAt(null);
        setIsLoading(false);
        return;
      }

      const data: DailyLimitData = JSON.parse(stored);

      // Si lastResetDate no es hoy, resetear
      if (!isToday(data.lastResetDate)) {
        const newData: DailyLimitData = {
          generationsCount: 0,
          lastResetDate: today,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        setRemaining(LIMIT);
        setResetAt(null);
      } else {
        // Usar datos existentes
        setRemaining(LIMIT - data.generationsCount);
        setResetAt(null);
      }
    } catch (error) {
      console.error("Error loading daily limit:", error);
      setRemaining(LIMIT);
    } finally {
      setIsLoading(false);
    }
  }, [isToday, getTodayISOString]);

  useEffect(() => {
    loadLimit();
  }, [loadLimit]);

  const canUse = useCallback(() => {
    return remaining > 0;
  }, [remaining]);

  const consume = useCallback(async (): Promise<boolean> => {
    if (!canUse()) {
      return false;
    }

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) {
        await loadLimit();
        return false;
      }

      const data: DailyLimitData = JSON.parse(stored);
      const today = getTodayISOString();

      // Si lastResetDate no es hoy, reiniciar antes de consumir
      if (!isToday(data.lastResetDate)) {
        const newData: DailyLimitData = {
          generationsCount: 1,
          lastResetDate: today,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        setRemaining(LIMIT - 1);
        return true;
      }

      // Incrementar contador
      const newCount = data.generationsCount + 1;
      const newData: DailyLimitData = {
        ...data,
        generationsCount: newCount,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setRemaining(LIMIT - newCount);
      return true;
    } catch (error) {
      console.error("Error consuming daily limit:", error);
      return false;
    }
  }, [canUse, loadLimit, isToday, getTodayISOString]);

  const addCredits = useCallback(
    async (amount: number): Promise<boolean> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const today = getTodayISOString();

        if (!stored) {
          // Si no hay datos, inicializar con los créditos añadidos
          const data: DailyLimitData = {
            generationsCount: Math.max(0, LIMIT - amount),
            lastResetDate: today,
          };
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          setRemaining(Math.min(LIMIT, amount));
          return true;
        }

        const data: DailyLimitData = JSON.parse(stored);

        // Si lastResetDate no es hoy, resetear y luego añadir créditos
        if (!isToday(data.lastResetDate)) {
          const newData: DailyLimitData = {
            generationsCount: Math.max(0, LIMIT - amount),
            lastResetDate: today,
          };
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
          setRemaining(Math.min(LIMIT, amount));
          return true;
        }

        // Añadir créditos (reducir el contador)
        const newCount = Math.max(0, data.generationsCount - amount);
        const newData: DailyLimitData = {
          ...data,
          generationsCount: newCount,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        setRemaining(LIMIT - newCount);
        return true;
      } catch (error) {
        console.error("Error adding credits:", error);
        return false;
      }
    },
    [isToday, getTodayISOString]
  );

  return {
    remaining,
    limit,
    resetAt,
    isLoading,
    canUse,
    consume,
    addCredits,
    refetch: loadLimit,
  };
}

