export const STORAGE_KEY = '@cosmetolog_appointments';
export const CLIENT_PREFIX = '@client_';
export const CLIENTS_REGISTRY_KEY = '@cosmetolog_clients_registry';
export const LAST_SYNC_KEY = '@cosmetolog_last_sync';

export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
export const now = () => new Date().toISOString();

export const isClientAppointment = (appointment) =>
  appointment?.type === 'client' || !appointment?.type;
