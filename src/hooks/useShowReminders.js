import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'showReminders';

export function useShowReminders() {
  const [showReminders, setShowReminders] = useState(true);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (active && v !== null) setShowReminders(v === 'true');
    });
    return () => { active = false; };
  }, []);

  const toggleReminders = useCallback(async () => {
    setShowReminders((prev) => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEY, String(next)).catch(() => {});
      return next;
    });
  }, []);

  return { showReminders, toggleReminders };
}
