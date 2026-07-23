import AsyncStorage from '@react-native-async-storage/async-storage';
import { isApiConfigured, syncAppointmentsToServer } from '../../config/api';
import { LAST_SYNC_KEY, now } from './keys';
import { loadLocal, saveLocal } from './local';
import { syncRemoteClientInfo } from './clients';

const pushToServer = async (appointments) => {
  if (!isApiConfigured()) return appointments;
  try {
    return await syncAppointmentsToServer(appointments);
  } catch (error) {
    console.warn('Синхронизация с VPS не удалась:', error.message);
    return appointments;
  }
};

export const mergeAppointments = (local, remote) => {
  const map = new Map();
  for (const item of remote) map.set(item.id, item);
  for (const item of local) {
    const existing = map.get(item.id);
    if (!existing) { map.set(item.id, item); continue; }
    const localTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
    const remoteTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
    map.set(item.id, localTime >= remoteTime ? item : existing);
  }
  return Array.from(map.values());
};

export const syncWithServer = async () => {
  const local = await loadLocal();
  if (!isApiConfigured()) return local;
  try {
    const remote = await pushToServer(local);
    const merged = mergeAppointments(local, remote);
    await saveLocal(merged);
    await AsyncStorage.setItem(LAST_SYNC_KEY, now());
    await syncRemoteClientInfo();
    return merged;
  } catch (error) {
    console.warn('syncWithServer:', error.message);
    return local;
  }
};

export const loadFromStorage = async () => {
  const local = await loadLocal();
  if (!isApiConfigured()) return local;
  try {
    const remote = await pushToServer(local);
    const merged = mergeAppointments(local, remote);
    if (JSON.stringify(merged) !== JSON.stringify(local)) {
      await saveLocal(merged);
    }
    return merged;
  } catch {
    return local;
  }
};

export const saveToStorage = async (appointments) => {
  await saveLocal(appointments);
  await pushToServer(appointments);
};

export { pushToServer };
