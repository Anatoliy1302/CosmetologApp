import { useCallback } from 'react';
import { Alert } from 'react-native';
import { formatDate, formatTemplate, getAddressByCity } from '../config/constants';
import { loadMessageTemplates } from '../config/templates';
import { updateAppointmentLocal } from '../config/storage';
import { sendSms, openWhatsApp } from '../config/messaging';

export function useReminderMessage(onAfterSend) {
  const sendDayBeforeReminder = useCallback(async (appointment) => {
    if (!appointment?.clientPhone) return;
    const templates = await loadMessageTemplates();
    const message = formatTemplate(templates.day_before, {
      clientName: appointment.clientName,
      service: appointment.service || 'услуга',
      date: formatDate(appointment.date),
      time: appointment.time,
      price: appointment.price,
      address: getAddressByCity(appointment.clientCity),
    });

    Alert.alert('📱 Отправить напоминание', 'Выберите способ', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: '📱 SMS',
        onPress: async () => {
          if (await sendSms(appointment.clientPhone, message)) {
            await updateAppointmentLocal(appointment.id, { reminderSent: true });
            onAfterSend?.();
          }
        },
      },
      {
        text: '💬 WhatsApp',
        onPress: async () => {
          if (await openWhatsApp(appointment.clientPhone, message)) {
            await updateAppointmentLocal(appointment.id, { reminderSent: true });
            onAfterSend?.();
          }
        },
      },
    ]);
  }, [onAfterSend]);

  return { sendDayBeforeReminder };
}
