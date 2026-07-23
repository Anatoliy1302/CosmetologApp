import { normalizePhone, normalizeDateString } from '../../config/constants';
import { isApiConfigured, putAppointment, deleteAppointmentRemote } from '../../config/api';
import { generateId, now, isClientAppointment } from './keys';
import { loadLocal, saveLocal } from './local';
import { saveClientToRegistry } from './clients';

export const addAppointmentLocal = async (data) => {
  const apps = await loadLocal();
  const timestamp = now();
  const normalizedDate = normalizeDateString(data.date);
  const newApp = {
    ...data,
    date: normalizedDate || data.date,
    id: generateId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  apps.push(newApp);
  await saveLocal(apps);

  if (isClientAppointment(newApp)) {
    await saveClientToRegistry({
      name: newApp.clientName,
      surname: newApp.clientSurname,
      phone: newApp.clientPhone,
      phoneNormalized: newApp.clientPhoneNormalized || normalizePhone(newApp.clientPhone),
      city: newApp.clientCity,
      lastVisit: newApp.date,
    });
  }

  if (isApiConfigured()) {
    try { await putAppointment(newApp); } catch (e) { console.warn(e.message); }
  }
  return newApp;
};

export const updateAppointmentLocal = async (id, updates) => {
  const apps = await loadLocal();
  const index = apps.findIndex((a) => a.id === id);
  if (index === -1) return;
  const patch = { ...updates };
  if (patch.date) patch.date = normalizeDateString(patch.date);
  const updated = { ...apps[index], ...patch, updatedAt: now() };
  apps[index] = updated;
  await saveLocal(apps);

  if (isClientAppointment(updated)) {
    await saveClientToRegistry({
      name: updated.clientName,
      surname: updated.clientSurname,
      phone: updated.clientPhone,
      phoneNormalized: updated.clientPhoneNormalized || normalizePhone(updated.clientPhone),
      city: updated.clientCity,
      lastVisit: updated.date,
    });
  }

  if (isApiConfigured()) {
    try { await putAppointment(updated); } catch (e) { console.warn(e.message); }
  }
};

export const deleteAppointmentLocal = async (id) => {
  const apps = await loadLocal();
  await saveLocal(apps.filter((a) => a.id !== id));
  if (isApiConfigured()) {
    try { await deleteAppointmentRemote(id); } catch (e) { console.warn(e.message); }
  }
};
