import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, SafeAreaView, Modal, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as SMS from 'expo-sms';
import { CITIES, formatDate, normalizePhone, getAddressByCity, toLocalDateString } from '../config/constants';
import { loadFromStorage, isClientAppointment } from '../config/storage';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { CityPickerModal } from '../components/forms/CityPickerModal';
import { COLORS } from '../config/colors';
import { commonStyles } from '../theme/commonStyles';

export const NotifyCityScreen = ({ navigation }) => {
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [clients, setClients] = useState([]);
  const [message, setMessage] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [selectedDate] = useState(toLocalDateString());

  const loadClientsByCity = useCallback(async (city, isActive = () => true) => {
    const allAppointments = await loadFromStorage();
    if (!isActive()) return;
    const appsInCity = allAppointments.filter((a) => isClientAppointment(a) && a.clientCity === city);
    const unique = new Map();
    appsInCity.forEach((a) => {
      const key = a.clientPhoneNormalized || normalizePhone(a.clientPhone || '');
      if (key && !unique.has(key)) {
        unique.set(key, { name: a.clientName || '', surname: a.clientSurname || '', phone: a.clientPhone || '' });
      }
    });
    if (!isActive()) return;
    setClients(Array.from(unique.values()));
    const address = getAddressByCity(city);
    setMessage(`🌸 Добрый день!\n\nКосметолог Альбина будет по адресу: ${address}\nДата: ${formatDate(selectedDate)}.\n\nВы можете записаться на приём.\n\n📞 Для записи позвоните\n\n✨ Косметолог Альбина`);
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadClientsByCity(selectedCity, () => active);
      return () => { active = false; };
    }, [selectedCity, loadClientsByCity])
  );

  const sendSmsToAll = async () => {
    if (clients.length === 0) { Alert.alert('Нет клиентов', 'Выберите город'); return; }
    try {
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) { Alert.alert('Ошибка', 'SMS недоступны'); return; }
      const phones = clients.filter(c => c.phone).map(c => c.phone);
      if (phones.length === 0) return;
      await SMS.sendSMSAsync(phones, message);
      Alert.alert('Готово', `SMS открыты для ${phones.length} клиентов`);
    } catch {
      Alert.alert('Ошибка', 'Не удалось открыть SMS');
    }
  };

  const sendWhatsAppToClient = async (client) => {
    if (!client.phone) return;
    try {
      const url = `whatsapp://send?phone=${normalizePhone(client.phone)}&text=${encodeURIComponent(message)}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert('Ошибка', 'WhatsApp не установлен');
    } catch {
      Alert.alert('Ошибка', 'Не удалось открыть WhatsApp');
    }
  };

  return (
    <SafeAreaView style={commonStyles.screen}>
      <ScreenHeader title="Оповещение" onBack={() => navigation.goBack()} backLabel="← Назад" backStyle="text" />
      <ScrollView style={commonStyles.formContainer}>
        <View style={commonStyles.formCard}>
          <Text style={styles.label}>🏙 Выберите город</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowCityPicker(true)}>
            <Text style={styles.dateButtonText}>{selectedCity || 'Выберите город'}</Text>
            <Text style={styles.calendarIcon}>🏙️</Text>
          </TouchableOpacity>
          {clients.length > 0 ? (
            <>
              <Text style={styles.label}>👥 Клиенты из {selectedCity}: {clients.length} чел.</Text>
              <Text style={styles.label}>📝 Текст сообщения</Text>
              <TextInput style={[styles.input, styles.textArea]} value={message} onChangeText={setMessage} multiline numberOfLines={5} placeholderTextColor={COLORS.textLight} />
              <TouchableOpacity style={styles.saveButton} onPress={() => Alert.alert('📢 Массовая рассылка', `Отправить SMS ${clients.length} клиентам?`, [{ text: 'Отмена', style: 'cancel' }, { text: 'SMS', onPress: sendSmsToAll }])}>
                <Text style={styles.saveButtonText}>📱 SMS всем ({clients.length})</Text>
              </TouchableOpacity>
              <Text style={styles.hint}>WhatsApp: отправляйте каждому клиенту отдельно (ограничение iOS)</Text>
              {clients.map((client, index) => (
                <TouchableOpacity key={`${client.phone}-${index}`} style={styles.clientRow} onPress={() => sendWhatsAppToClient(client)}>
                  <Text style={styles.clientName}>{client.surname ? `${client.name} ${client.surname}` : client.name}</Text>
                  <Text style={styles.clientAction}>💬 WhatsApp</Text>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <View style={styles.emptyContainer}><Text style={styles.emptyText}>Нет клиентов из {selectedCity}</Text></View>
          )}
        </View>
      </ScrollView>
      <CityPickerModal visible={showCityPicker} selectedCity={selectedCity} onSelect={setSelectedCity} onClose={() => setShowCityPicker(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: COLORS.headerBg, borderBottomWidth: 1, borderBottomColor: COLORS.primaryDark },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textOnPrimary },
  backButton: { fontSize: 16, color: COLORS.textOnPrimary, fontWeight: '500' },
  formContainer: { flex: 1, padding: 15 },
  formCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: COLORS.border },
  label: { marginBottom: 8, marginTop: 10, fontSize: 14, fontWeight: '600', color: COLORS.primary, textTransform: 'uppercase' },
  input: { backgroundColor: COLORS.inputBg, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, fontSize: 16, color: COLORS.textPrimary },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  dateButton: { backgroundColor: COLORS.inputBg, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateButtonText: { fontSize: 16, color: COLORS.textPrimary },
  calendarIcon: { fontSize: 20 },
  saveButton: { marginTop: 16, padding: 16, borderRadius: 15, alignItems: 'center', backgroundColor: COLORS.info },
  saveButtonText: { color: COLORS.textOnPrimary, fontSize: 16, fontWeight: 'bold' },
  hint: { fontSize: 12, color: COLORS.textLight, marginTop: 12, marginBottom: 8 },
  clientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  clientName: { fontSize: 15, color: COLORS.textPrimary, flex: 1 },
  clientAction: { fontSize: 14, color: COLORS.success, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 20 },
  emptyText: { textAlign: 'center', color: COLORS.textLight, fontSize: 16 },
  contextMenuOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', alignItems: 'center' },
  contextMenu: { backgroundColor: COLORS.cardBg, borderRadius: 15, padding: 10, width: 260, borderWidth: 1, borderColor: COLORS.border },
  contextMenuItem: { paddingVertical: 14, paddingHorizontal: 20 },
  contextMenuText: { fontSize: 16, color: COLORS.textPrimary },
  contextMenuTextActive: { color: COLORS.primary, fontWeight: 'bold' },
});
