import { useState, useCallback, useRef, useEffect } from 'react';
import { loadFromStorage, syncWithServer } from '../config/storage';
import { scheduleAllReminders } from '../config/notifications';
import { isApiConfigured, checkApiHealth } from '../config/api';
import { useAsyncFocus } from './useAsyncFocus';

export function useAppointments({ syncOnFocus = false, scheduleReminders = false } = {}) {
  const [appointments, setAppointments] = useState([]);
  const [syncStatus, setSyncStatus] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(async (isActive) => {
    const raw = syncOnFocus && isApiConfigured() ? await syncWithServer() : await loadFromStorage();
    const data = Array.isArray(raw) ? raw : [];
    if (!isActive()) return;
    setAppointments(data);
    if (scheduleReminders) {
      try {
        await scheduleAllReminders(data);
      } catch (error) {
        console.warn('Не удалось запланировать напоминания:', error?.message || error);
      }
    }
    if (!isActive()) return;
    if (isApiConfigured()) {
      const online = await checkApiHealth();
      if (isActive()) setSyncStatus(online ? '☁️ VPS' : '⚠️ офлайн');
    } else if (isActive()) {
      setSyncStatus('');
    }
  }, [syncOnFocus, scheduleReminders]);

  const { loading, setLoading } = useAsyncFocus(load, [load]);

  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    await load(() => mountedRef.current);
    if (mountedRef.current) setLoading(false);
  }, [load, setLoading]);

  return { appointments, setAppointments, loading, syncStatus, refresh };
}
