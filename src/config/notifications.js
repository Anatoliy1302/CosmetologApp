import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { getAddressByCity } from './constants';
import { isClientAppointment } from './storage';
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

let lastScheduledHash = '';

export async function registerForPushNotificationsAsync() {
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('Уведомления отключены', 'Включите уведомления в настройках телефона');
      return null;
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('appointments', {
        name: 'Записи',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#9B59B6',
      });
    }
  }
}

export async function scheduleAppointmentReminder(appointment) {
  if (!appointment || !appointment.date || !appointment.time) return;

  const address = getAddressByCity(appointment.clientCity);
  const appointmentDate = new Date(`${appointment.date}T${appointment.time}:00`);
  if (!Number.isFinite(appointmentDate.getTime())) return;
  const reminderDate = new Date(appointmentDate);
  reminderDate.setDate(reminderDate.getDate() - 1);
  reminderDate.setHours(20, 0, 0, 0);

  if (reminderDate <= new Date()) return;

  const clientName = appointment.clientName || 'Клиент';
  const serviceName = appointment.service || 'услуга';
  const secondsUntilReminder = Math.floor((reminderDate.getTime() - Date.now()) / 1000);

  if (!Number.isFinite(secondsUntilReminder) || secondsUntilReminder <= 0) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Напоминание о записи',
      body: `Завтра в ${appointment.time} — ${clientName}\n${serviceName}\n📍 ${address}`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: { appointmentId: appointment.id, type: 'reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsUntilReminder,
    },
  });
}

export async function cancelAppointmentReminder(appointmentId) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.data?.appointmentId === appointmentId) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}

const buildScheduleHash = (appointments) => {
  if (!Array.isArray(appointments)) return '';
  const clientApps = appointments.filter(isClientAppointment);
  return clientApps
    .map((a) => `${a.id}:${a.date}:${a.time}:${a.updatedAt || ''}`)
    .sort()
    .join('|');
};

export async function scheduleAllReminders(appointments) {
  if (!Array.isArray(appointments)) return;
  const hash = buildScheduleHash(appointments);
  if (hash === lastScheduledHash) return;
  lastScheduledHash = hash;

  const clientApps = appointments.filter(isClientAppointment);
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const app of clientApps) {
    try {
      await scheduleAppointmentReminder(app);
    } catch (error) {
      console.warn('Не удалось запланировать напоминание:', app?.id, error?.message || error);
    }
  }
}

export function resetReminderCache() {
  lastScheduledHash = '';
}
