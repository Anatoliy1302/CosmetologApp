import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, SafeAreaView, Modal, Linking } from 'react-native';
import * as SMS from 'expo-sms';
import { COLORS } from '../config/colors';
import { CITIES, formatDate, normalizePhone, getAddressByCity } from '../config/constants';

export const NotifyCityScreen = ({ route, navigation }) => {
  const { allAppointments, selectedDate } = route.params || {};
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [clients, setClients] = useState([]);
  const [message, setMessage] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);

  useEffect(() => { loadClientsByCity(selectedCity); }, [selectedCity]);

  const loadClientsByCity = (city) => {
    if (!city || !allAppointments) return;
    const appsInCity = allAppointments.filter(a => (a.type === 'client' || !a.type) && a.clientCity === city);
    const unique = new Map();
    appsInCity.forEach(a => {
      const key = a.clientPhoneNormalized || normalizePhone(a.clientPhone || '');
      if (key && !unique.has(key)) unique.set(key, { name: a.clientName || '', surname: a.clientSurname || '', phone: a.clientPhone || '' });
    });
    setClients(Array.from(unique.values()));
    
    const address = getAddressByCity(city);
    setMessage(`🌸 Добрый день!\n\nКосметолог Альбина будет по адресу: ${address}\nДата: ${formatDate(selectedDate || new Date().toISOString().split('T')[0])}.\n\nВы можете записаться на приём.\n\n📞 Для записи позвоните\n\n✨ Косметолог Альбина`);
  };

  const sendToAll = () => {
    if (clients.length === 0) { Alert.alert('Нет клиентов', 'Выберите город'); return; }
    Alert.alert('📢 Массовая рассылка', `Отправить сообщение ${clients.length} клиентам из ${selectedCity}?`, [
      { text: 'Отмена', style: 'cancel' },
      { text: '💬 WhatsApp', onPress: async () => {
        for (const client of clients) {
          if (client.phone) {
            const url = `whatsapp://send?phone=${normalizePhone(client.phone)}&text=${encodeURIComponent(message)}`;
            const supported = await Linking.canOpenURL(url);
            if (supported) { await Linking.openURL(url); await new Promise(r => setTimeout(r, 500)); }
          }
        }
        Alert.alert('Готово', 'Все сообщения отправлены в WhatsApp');
      }},
      { text: '📱 SMS', onPress: async () => {
        const isAvailable = await SMS.isAvailableAsync();
        if (isAvailable) {
          const phones = clients.filter(c => c.phone).map(c => c.phone);
          if (phones.length > 0) { await SMS.sendSMSAsync(phones, message); Alert.alert('Готово', 'SMS отправлены'); }
        } else { Alert.alert('Ошибка', 'SMS недоступны'); }
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backButton}>← Назад</Text></TouchableOpacity><Text style={styles.headerTitle}>Оповещение</Text><View style={{ width: 60 }} /></View>
      <ScrollView style={styles.formContainer}>
        <View style={styles.formCard}>
          <Text style={styles.label}>🏙 Выберите город</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowCityPicker(true)}>
            <Text style={styles.dateButtonText}>{selectedCity || 'Выберите город'}</Text>
            <Text style={styles.calendarIcon}>🏙️</Text>
          </TouchableOpacity>
          {clients.length > 0 && (
            <>
              <Text style={styles.label}>👥 Клиенты из {selectedCity}: {clients.length} чел.</Text>
              <Text style={styles.label}>📝 Текст сообщения</Text>
              <TextInput style={[styles.input, styles.textArea]} value={message} onChangeText={setMessage} multiline numberOfLines={5} placeholderTextColor={COLORS.textLight} />
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: COLORS.info }]} onPress={sendToAll}>
                <Text style={styles.saveButtonText}>📢 Отправить всем ({clients.length})</Text>
              </TouchableOpacity>
            </>
          )}
          {clients.length === 0 && <View style={styles.emptyContainer}><Text style={styles.emptyText}>Нет клиентов из {selectedCity}</Text></View>}
        </View>
      </ScrollView>
      <Modal visible={showCityPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.contextMenuOverlay} activeOpacity={1} onPress={() => setShowCityPicker(false)}>
          <View style={styles.contextMenu}>
            {CITIES.map((cityName) => (
              <TouchableOpacity key={cityName} style={styles.contextMenuItem} onPress={() => { setSelectedCity(cityName); setShowCityPicker(false); }}>
                <Text style={[styles.contextMenuText, selectedCity === cityName && { color: COLORS.primary, fontWeight: 'bold' }]}>{cityName} {selectedCity === cityName ? '✓' : ''}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: COLORS.headerBg },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  backButton: { fontSize: 16, color: '#FFFFFF', fontWeight: '500' },
  formContainer: { flex: 1, backgroundColor: COLORS.background },
  formCard: { backgroundColor: COLORS.cardBg, marginHorizontal: 15, marginTop: 15, marginBottom: 30, paddingVertical: 20, borderRadius: 20 },
  label: { marginHorizontal: 20, marginBottom: 5, marginTop: 10, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  input: { backgroundColor: COLORS.background, marginHorizontal: 20, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, fontSize: 16, color: COLORS.textPrimary },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  dateButton: { backgroundColor: COLORS.background, marginHorizontal: 20, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateButtonText: { fontSize: 16, color: COLORS.textPrimary },
  calendarIcon: { fontSize: 20 },
  saveButton: { marginHorizontal: 20, marginTop: 20, padding: 16, borderRadius: 15, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 20 },
  emptyText: { textAlign: 'center', color: COLORS.textLight, fontSize: 16 },
  contextMenuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  contextMenu: { backgroundColor: COLORS.cardBg, borderRadius: 15, padding: 10, width: 260 },
  contextMenuItem: { paddingVertical: 14, paddingHorizontal: 20 },
  contextMenuText: { fontSize: 16, color: COLORS.textPrimary },
});