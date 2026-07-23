import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEY } from './keys';

export const saveLocal = async (appointments) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
};

export const loadLocal = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    return [];
  }
};
