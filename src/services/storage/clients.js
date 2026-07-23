import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizePhone, normalizeDateString } from '../../config/constants';
import { isApiConfigured, putClientInfo, fetchClientInfoMap } from '../../config/api';
import { CLIENT_PREFIX, CLIENTS_REGISTRY_KEY, now, isClientAppointment } from './keys';
import { loadLocal } from './local';

export const clientKey = (client) => {
  const phone = client.phoneNormalized || normalizePhone(client.phone);
  if (phone) return phone;
  const name = `${client.name || ''}_${client.surname || ''}`.trim().toLowerCase();
  return name ? `name:${name}` : '';
};

const loadClientsRegistry = async () => {
  try {
    const raw = await AsyncStorage.getItem(CLIENTS_REGISTRY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveClientToRegistry = async (client) => {
  const key = clientKey(client);
  if (!key) return;
  const registry = await loadClientsRegistry();
  const existing = registry[key] || {};
  registry[key] = {
    name: client.name || existing.name || '',
    surname: client.surname || existing.surname || '',
    phone: client.phone || existing.phone || '',
    phoneNormalized: client.phoneNormalized || normalizePhone(client.phone) || key,
    city: client.city || existing.city || '',
    lastVisit: client.lastVisit || existing.lastVisit || '',
    updatedAt: now(),
  };
  await AsyncStorage.setItem(CLIENTS_REGISTRY_KEY, JSON.stringify(registry));
};

export const loadClientInfo = async (phone) => {
  try {
    const raw = await AsyncStorage.getItem(`${CLIENT_PREFIX}${phone}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export const saveClientInfo = async (phone, info) => {
  const payload = { ...info, updatedAt: now() };
  await AsyncStorage.setItem(`${CLIENT_PREFIX}${phone}`, JSON.stringify(payload));
  if (isApiConfigured()) {
    try { await putClientInfo(phone, payload); } catch (e) { console.warn(e.message); }
  }
};

export const isClientBlocked = async (phone) => {
  const info = await loadClientInfo(phone);
  return Boolean(info.isBlocked);
};

export const syncRemoteClientInfo = async () => {
  const remoteClients = await fetchClientInfoMap();
  for (const [phone, info] of Object.entries(remoteClients)) {
    await AsyncStorage.setItem(`${CLIENT_PREFIX}${phone}`, JSON.stringify(info));
  }
};

export const loadExistingClientsFromStorage = async () => {
  const registry = await loadClientsRegistry();
  const apps = await loadLocal();
  const clientsMap = new Map();

  if (Object.keys(registry).length === 0 && apps.length > 0) {
    for (const data of apps) {
      if (!isClientAppointment(data)) continue;
      await saveClientToRegistry({
        name: data.clientName,
        surname: data.clientSurname,
        phone: data.clientPhone,
        phoneNormalized: data.clientPhoneNormalized || normalizePhone(data.clientPhone),
        city: data.clientCity,
        lastVisit: data.date,
      });
    }
    const migrated = await loadClientsRegistry();
    Object.entries(migrated).forEach(([key, client]) => {
      clientsMap.set(key, { ...client, phoneNormalized: client.phoneNormalized || key });
    });
  } else {
    Object.entries(registry).forEach(([key, client]) => {
      clientsMap.set(key, { ...client, phoneNormalized: client.phoneNormalized || key });
    });
  }

  apps.forEach((data) => {
    if (!isClientAppointment(data)) return;
    const normalizedPhone = data.clientPhoneNormalized || normalizePhone(data.clientPhone || '');
    const key = normalizedPhone || clientKey({ name: data.clientName, surname: data.clientSurname });
    if (!key) return;
    const existing = clientsMap.get(key) || {};
    const visitDate = normalizeDateString(data.date);
    const existingVisit = normalizeDateString(existing.lastVisit);
    const useNewVisit = !existingVisit || visitDate >= existingVisit;
    clientsMap.set(key, {
      name: data.clientName || existing.name || '',
      surname: data.clientSurname || existing.surname || '',
      phone: data.clientPhone || existing.phone || '',
      phoneNormalized: normalizedPhone || key,
      city: data.clientCity || existing.city || '',
      lastVisit: useNewVisit ? (data.date || existing.lastVisit) : existing.lastVisit,
    });
  });

  return Array.from(clientsMap.values()).sort((a, b) =>
    (b.lastVisit || '').localeCompare(a.lastVisit || '')
  );
};
