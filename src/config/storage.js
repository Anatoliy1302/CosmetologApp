import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@cosmetolog_appointments';

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const loadFromStorage = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    return [];
  }
};

export const saveToStorage = async (appointments) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  } catch (error) {
    console.error('Ошибка сохранения:', error);
  }
};

export const addAppointmentLocal = async (data) => {
  const apps = await loadFromStorage();
  const newApp = { ...data, id: generateId(), createdAt: new Date().toISOString() };
  apps.push(newApp);
  await saveToStorage(apps);
  return newApp;
};

export const updateAppointmentLocal = async (id, updates) => {
  const apps = await loadFromStorage();
  const index = apps.findIndex(a => a.id === id);
  if (index !== -1) {
    apps[index] = { ...apps[index], ...updates };
    await saveToStorage(apps);
  }
};

export const deleteAppointmentLocal = async (id) => {
  const apps = await loadFromStorage();
  await saveToStorage(apps.filter(a => a.id !== id));
};

export const loadExistingClientsFromStorage = async () => {
  const apps = await loadFromStorage();
  const clientsMap = new Map();
  apps.forEach(data => {
    if (data.type === 'client' || !data.type) {
      const normalizedPhone = data.clientPhoneNormalized || data.clientPhone?.replace(/[^0-9]/g, '') || '';
      if (normalizedPhone && !clientsMap.has(normalizedPhone)) {
        clientsMap.set(normalizedPhone, {
          name: data.clientName || '',
          surname: data.clientSurname || '',
          phone: data.clientPhone || '',
          city: data.clientCity || '',
          lastVisit: data.date || '',
        });
      }
    }
  });
  return Array.from(clientsMap.values());
};