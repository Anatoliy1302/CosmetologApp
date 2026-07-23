import AsyncStorage from '@react-native-async-storage/async-storage';
import { REMINDER_TEMPLATES as DEFAULT_TEMPLATES } from './constants';

const STORAGE_KEY = '@cosmetolog_message_templates';

export const TEMPLATE_VARIABLES = [
  { key: '{client_name}', label: 'Имя клиента' },
  { key: '{service}', label: 'Услуга' },
  { key: '{date}', label: 'Дата' },
  { key: '{time}', label: 'Время' },
  { key: '{price}', label: 'Цена' },
  { key: '{address}', label: 'Адрес' },
];

export const loadMessageTemplates = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_TEMPLATES };
    return { ...DEFAULT_TEMPLATES, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_TEMPLATES };
  }
};

export const saveMessageTemplates = async (templates) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
};

export const resetMessageTemplates = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
  return { ...DEFAULT_TEMPLATES };
};
