import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

export const API_URL = (extra.apiUrl || 'http://79.137.192.194:3847').replace(/\/$/, '');
export const API_KEY = extra.apiKey || '';

const headers = () => ({
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY,
});

export const isApiConfigured = () =>
  API_URL && Boolean(API_KEY);

export async function fetchAppointments() {
  const res = await fetch(`${API_URL}/api/appointments`, { headers: headers() });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  return data.appointments || [];
}

export async function syncAppointmentsToServer(appointments) {
  const res = await fetch(`${API_URL}/api/appointments/sync`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ appointments }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  return data.appointments || [];
}

export async function putAppointment(appointment) {
  const res = await fetch(`${API_URL}/api/appointments/${appointment.id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(appointment),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  return data.appointment;
}

export async function deleteAppointmentRemote(id) {
  const res = await fetch(`${API_URL}/api/appointments/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
}

export async function fetchClientInfoMap() {
  const res = await fetch(`${API_URL}/api/clients`, { headers: headers() });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  return data.clients || {};
}

export async function putClientInfo(phone, info) {
  const res = await fetch(`${API_URL}/api/clients/${encodeURIComponent(phone)}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(info),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  return data.client;
}

export async function checkApiHealth() {
  try {
    const res = await fetch(`${API_URL}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
