import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity,
  ScrollView, Alert, SafeAreaView, Modal, Linking, Clipboard, Keyboard,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import * as SMS from 'expo-sms';
import { CITIES, formatDate, formatTemplate, REMINDER_TEMPLATES, normalizePhone, getAddressByCity } from '../config/constants';
import { addAppointmentLocal, loadExistingClientsFromStorage } from '../config/storage';
import { TimeSelector } from '../components/TimePicker';
import { scheduleAppointmentReminder } from '../config/notifications';

export const NewAppointmentScreen = ({ route, navigation }) => {
  const { selectedDate, onSave, clientPrefill } = route.params || {};
  const [clientName, setClientName] = useState(clientPrefill?.name || '');
  const [clientSurname, setClientSurname] = useState(clientPrefill?.surname || '');
  const [phone, setPhone] = useState(clientPrefill?.phone || '');
  const [service, setService] = useState('');
  const [date, setDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [price, setPrice] = useState('');
  const [comment, setComment] = useState('');
  const [city, setCity] = useState(clientPrefill?.city || CITIES[0]);
  const [saving, setSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCityPickerModal, setShowCityPickerModal] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [existingClients, setExistingClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');

  useEffect(() => { loadExistingClientsFromStorage().then(setExistingClients); }, []);

  const selectClient = (client) => {
    setClientName(client.name); setClientSurname(client.surname);
    setPhone(client.phone); setCity(client.city || CITIES[0]);
    setShowClientPicker(false); setClientSearch(''); Keyboard.dismiss();
  };

  const filteredClients = existingClients.filter(client => {
    if (!clientSearch.trim()) return true;
    const q = clientSearch.toLowerCase();
    return `${client.name} ${client.surname}`.toLowerCase().includes(q) || client.phone.includes(q);
  });

  const showNotificationOptions = () => {
    const address = getAddressByCity(city);
    const message = formatTemplate(REMINDER_TEMPLATES.confirmation, { 
      clientName, 
      service: service || 'услуга', 
      date: formatDate(date), 
      time, 
      price: price || '0',
      address: address
    });
    Alert.alert('✅ Запись добавлена!', 'Как отправить подтверждение клиенту?', [
      { text: 'Позже', style: 'cancel', onPress: () => { setSaving(false); navigation.goBack(); } },
      { text: '📋 Копировать', onPress: () => { Clipboard.setString(message); setSaving(false); navigation.goBack(); } },
      { text: '💬 WhatsApp', onPress: async () => { setSaving(false); const url = `whatsapp://send?phone=${normalizePhone(phone)}&text=${encodeURIComponent(message)}`; const s = await Linking.canOpenURL(url); if (s) await Linking.openURL(url); else Alert.alert('Ошибка', 'WhatsApp не установлен'); navigation.goBack(); }},
      { text: '📱 SMS', onPress: async () => { setSaving(false); const isAv = await SMS.isAvailableAsync(); if (isAv) await SMS.sendSMSAsync([phone], message); else Alert.alert('Ошибка', 'SMS недоступны'); navigation.goBack(); }}
    ]);
  };

  const save = async () => {
    if (!clientName || !date || !time) { 
      Alert.alert('Ошибка', 'Заполните обязательные поля: имя, дата, время'); 
      return; 
    }
    setSaving(true);
    try {
      const newApp = await addAppointmentLocal({
        type: 'client', 
        clientName: clientName.trim(), 
        clientSurname: clientSurname.trim(),
        clientPhone: phone.trim(), 
        clientPhoneNormalized: normalizePhone(phone),
        service: service.trim() || '',
        date: date.trim(), 
        time: time.trim(),
        price: parseInt(price, 10) || 0, 
        comment: comment.trim(), 
        clientCity: city, 
        reminderSent: false
      });
      if (newApp && newApp.id) {
        await scheduleAppointmentReminder(newApp);
      }
      if (onSave) onSave();
      showNotificationOptions();
    } catch (error) { 
      console.error('Ошибка сохранения:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить запись'); 
      setSaving(false); 
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Новая запись</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          style={styles.formContainer} 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {existingClients.length > 0 && (
            <TouchableOpacity style={styles.selectClientBtn} onPress={() => setShowClientPicker(true)}>
              <Text style={styles.selectClientBtnIcon}>👤</Text>
              <Text style={styles.selectClientBtnText}>Выбрать из ранее записанных</Text>
              <Text style={styles.selectClientBtnArrow}>›</Text>
            </TouchableOpacity>
          )}

          <View style={styles.formCard}>
            <Text style={styles.label}>Имя клиента *</Text>
            <TextInput 
              style={styles.input} 
              value={clientName} 
              onChangeText={setClientName} 
              placeholder="Иван" 
              placeholderTextColor="#555555" 
              returnKeyType="next"
            />

            <Text style={styles.label}>Фамилия</Text>
            <TextInput 
              style={styles.input} 
              value={clientSurname} 
              onChangeText={setClientSurname} 
              placeholder="Иванов" 
              placeholderTextColor="#555555" 
              returnKeyType="next"
            />

            <Text style={styles.label}>Телефон</Text>
            <TextInput 
              style={styles.input} 
              value={phone} 
              onChangeText={setPhone} 
              placeholder="+7 999 123-45-67" 
              keyboardType="phone-pad" 
              placeholderTextColor="#555555" 
              returnKeyType="next"
            />

            <Text style={styles.label}>Услуга (необязательно)</Text>
            <TextInput 
              style={styles.input} 
              value={service} 
              onChangeText={setService} 
              placeholder="Название услуги" 
              placeholderTextColor="#555555" 
              returnKeyType="next"
            />

            <Text style={styles.label}>Город</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowCityPickerModal(true)}>
              <Text style={styles.pickerBtnText}>{city || 'Выберите город'}</Text>
              <Text style={styles.pickerBtnIcon}>🏙️</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Дата *</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowCalendar(!showCalendar)}>
              <Text style={styles.pickerBtnText}>{date ? formatDate(date) : 'Выберите дату'}</Text>
              <Text style={styles.pickerBtnIcon}>📅</Text>
            </TouchableOpacity>
            {showCalendar && (
              <Calendar 
                onDayPress={(day) => { setDate(day.dateString); setShowCalendar(false); }} 
                markedDates={{ [date]: { selected: true, selectedColor: '#9B59B6' } }} 
                theme={{ 
                  backgroundColor: '#1C1C1E', 
                  calendarBackground: '#1C1C1E', 
                  selectedDayBackgroundColor: '#9B59B6', 
                  todayTextColor: '#9B59B6', 
                  arrowColor: '#9B59B6', 
                  monthTextColor: '#FFFFFF', 
                  textDayFontSize: 15, 
                  textMonthFontSize: 16, 
                  dayTextColor: '#FFFFFF', 
                  textDisabledColor: '#555555' 
                }} 
                style={styles.inlineCalendar} 
              />
            )}

            <Text style={styles.label}>Время *</Text>
            <TimeSelector value={time} onSelect={setTime} />

            <Text style={styles.label}>Стоимость (₽)</Text>
            <TextInput 
              style={styles.input} 
              value={price} 
              onChangeText={setPrice} 
              placeholder="0" 
              keyboardType="numeric" 
              placeholderTextColor="#555555" 
              returnKeyType="next"
            />

            <Text style={styles.label}>Комментарий</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              value={comment} 
              onChangeText={setComment} 
              placeholder="Заметки..." 
              multiline 
              numberOfLines={3} 
              placeholderTextColor="#555555" 
              returnKeyType="done"
            />

            <TouchableOpacity 
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
              onPress={save} 
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Сохранение...' : '✓ Сохранить запись'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showCityPickerModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCityPickerModal(false)}>
          <View style={styles.contextMenu}>
            {CITIES.map(c => (
              <TouchableOpacity key={c} style={styles.contextMenuItem} onPress={() => { setCity(c); setShowCityPickerModal(false); }}>
                <Text style={[styles.contextMenuText, city === c && styles.contextMenuTextActive]}>{c} {city === c ? '✓' : ''}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showClientPicker} transparent animationType="slide">
        <View style={styles.modalOverlayDark}>
          <View style={styles.clientPickerContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ранее записанные клиенты</Text>
              <TouchableOpacity onPress={() => { setShowClientPicker(false); setClientSearch(''); }}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput 
                style={styles.searchInput} 
                placeholder="Поиск..." 
                value={clientSearch} 
                onChangeText={setClientSearch} 
                placeholderTextColor="#555555" 
              />
            </View>
            <FlatList 
              data={filteredClients} 
              keyExtractor={(item, index) => `${item.phone}-${index}`} 
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.clientItem} onPress={() => selectClient(item)}>
                  <View style={styles.clientItemAvatar}><Text style={styles.clientItemAvatarText}>👤</Text></View>
                  <View style={styles.clientItemInfo}>
                    <Text style={styles.clientItemName}>{item.surname ? `${item.name} ${item.surname}` : item.name}</Text>
                    {item.phone ? <Text style={styles.clientItemPhone}>{item.phone}</Text> : null}
                    {item.city ? <Text style={styles.clientItemCity}>📍 {item.city}</Text> : null}
                  </View>
                  <Text style={styles.clientItemArrow}>›</Text>
                </TouchableOpacity>
              )} 
              ListEmptyComponent={<Text style={styles.emptyListText}>{clientSearch ? 'Ничего не найдено' : 'Нет клиентов'}</Text>} 
              style={{ maxHeight: 400 }} 
              keyboardShouldPersistTaps="handled" 
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1C1E' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#2C2C2E', borderBottomWidth: 1, borderBottomColor: '#3A3A3C' },
  backBtn: { padding: 5 },
  backBtnText: { fontSize: 24, color: '#9B59B6', fontWeight: '600' },
  topBarTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  formContainer: { flex: 1, padding: 15 },
  selectClientBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', padding: 14, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#9B59B6' },
  selectClientBtnIcon: { fontSize: 20, marginRight: 10 },
  selectClientBtnText: { flex: 1, fontSize: 15, color: '#FFFFFF', fontWeight: '500' },
  selectClientBtnArrow: { fontSize: 20, color: '#9B59B6' },
  formCard: { backgroundColor: '#2C2C2E', borderRadius: 16, padding: 20, marginBottom: 30 },
  label: { fontSize: 13, fontWeight: '600', color: '#9B59B6', marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#1C1C1E', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#3A3A3C', fontSize: 16, color: '#FFFFFF' },
  textArea: { minHeight: 80, textAlignVertical: 'top', paddingTop: 14 },
  pickerBtn: { backgroundColor: '#1C1C1E', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#3A3A3C', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerBtnText: { fontSize: 16, color: '#FFFFFF' },
  pickerBtnIcon: { fontSize: 20 },
  inlineCalendar: { marginTop: 10, borderRadius: 12 },
  saveBtn: { backgroundColor: '#9B59B6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20, marginBottom: 10, elevation: 4, shadowColor: '#9B59B6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  saveBtnDisabled: { backgroundColor: '#555555' },
  saveBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalOverlayDark: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  contextMenu: { backgroundColor: '#2C2C2E', borderRadius: 15, padding: 10, width: 260 },
  contextMenuItem: { paddingVertical: 14, paddingHorizontal: 20 },
  contextMenuText: { fontSize: 16, color: '#FFFFFF' },
  contextMenuTextActive: { color: '#9B59B6', fontWeight: '700' },
  clientPickerContent: { backgroundColor: '#2C2C2E', borderRadius: 20, padding: 20, width: '92%', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#3A3A3C' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  closeBtn: { fontSize: 22, color: '#8E8E93' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 10, paddingHorizontal: 12, marginVertical: 10 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#FFFFFF' },
  clientItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#3A3A3C' },
  clientItemAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#9B59B625', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  clientItemAvatarText: { fontSize: 18 },
  clientItemInfo: { flex: 1 },
  clientItemName: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  clientItemPhone: { fontSize: 13, color: '#AAAAAA', marginTop: 2 },
  clientItemCity: { fontSize: 12, color: '#9B59B6', marginTop: 2 },
  clientItemArrow: { fontSize: 18, color: '#555555' },
  emptyListText: { textAlign: 'center', color: '#8E8E93', fontSize: 15, marginTop: 30 },
});