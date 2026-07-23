import { Alert, Linking } from 'react-native';
import * as SMS from 'expo-sms';
import { normalizePhone } from './constants';

export const callPhone = (phone) => {
  if (!phone) return;
  Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Ошибка', 'Не удалось позвонить'));
};

export const sendSms = async (phone, message = '') => {
  if (!phone) return false;
  try {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Ошибка', 'SMS недоступны');
      return false;
    }
    await SMS.sendSMSAsync([phone], message);
    return true;
  } catch {
    Alert.alert('Ошибка', 'Не удалось открыть SMS');
    return false;
  }
};

export const openWhatsApp = async (phone, message = '') => {
  if (!phone) return false;
  try {
    const url = `whatsapp://send?phone=${normalizePhone(phone)}${message ? `&text=${encodeURIComponent(message)}` : ''}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Ошибка', 'WhatsApp не установлен');
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert('Ошибка', 'Не удалось открыть WhatsApp');
    return false;
  }
};

export const showMessageChannelAlert = (title, message, options = {}) => {
  const { onSms, onWhatsApp, onCancel } = options;
  Alert.alert(title, message, [
    { text: 'Отмена', style: 'cancel', onPress: onCancel },
    { text: '📱 SMS', onPress: onSms },
    { text: '💬 WhatsApp', onPress: onWhatsApp },
  ]);
};
