import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, SafeAreaView, Modal, Linking } from 'react-native';
import { Calendar } from 'react-native-calendars';
import * as SMS from 'expo-sms';
import { COLORS } from '../config/colors';
import { CITIES, formatDate, formatTemplate, REMINDER_TEMPLATES, normalizePhone, getAddressByCity } from '../config/constants';
import { updateAppointmentLocal, deleteAppointmentLocal } from '../config/storage';
import { TimeSelector } from '../components/TimePicker';
import { scheduleAppointmentReminder, cancelAppointmentReminder } from '../config/notifications';

export const EditAppointmentScreen = ({ route, navigation }) => {
  const { appointment, onUpdate } = route.params;
  const isClient = appointment?.type === 'client' || !appointment?.type;
  const isPersonal = appointment?.type === 'personal';
  const isBreak = appointment?.type === 'break';

  const [clientName, setClientName] = useState(appointment?.clientName || '');
  const [clientSurname, setClientSurname] = useState(appointment?.clientSurname || '');
  const [phone, setPhone] = useState(appointment?.clientPhone || '');
  const [service, setService] = useState(appointment?.service || '');
  const [title, setTitle] = useState(appointment?.title || '');
  const [description, setDescription] = useState(appointment?.description || '');
  const [date, setDate] = useState(appointment?.date || '');
  const [time, setTime] = useState(appointment?.time || '');
  const [price, setPrice] = useState(appointment?.price?.toString() || '');
  const [comment, setComment] = useState(appointment?.comment || '');
  const [duration, setDuration] = useState(appointment?.duration?.toString() || '30');
  const [city, setCity] = useState(appointment?.clientCity || CITIES[0]);
  const [saving, setSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCityPickerModal, setShowCityPickerModal] = useState(false);

  const update = async () => {
    if (!date || !time) { Alert.alert('Ошибка', 'Заполните дату и время'); return; }
    if (isClient && !clientName) { Alert.alert('Ошибка', 'Заполните обязательные поля: имя'); return; }
    if (isPersonal && !title) { Alert.alert('Ошибка', 'Введите заголовок'); return; }
    setSaving(true);
    try {
      const updateData = { date: date.trim(), time: time.trim() };
      if (isClient) {
        updateData.clientName = clientName.trim(); updateData.clientSurname = clientSurname.trim();
        updateData.clientPhone = phone.trim(); updateData.clientPhoneNormalized = normalizePhone(phone);
        updateData.service = service.trim() || '';
        updateData.price = parseInt(price, 10) || 0;
        updateData.comment = comment.trim(); updateData.clientCity = city;
      } else if (isPersonal) {
        updateData.title = title.trim(); updateData.description = description.trim();
      } else if (isBreak) {
        updateData.description = description.trim(); updateData.duration = parseInt(duration, 10) || 30;
      }
      await updateAppointmentLocal(appointment.id, updateData);
      if (isClient) {
        await cancelAppointmentReminder(appointment.id);
        await scheduleAppointmentReminder({ ...appointment, ...updateData });
      }
      Alert.alert('Успех', 'Запись обновлена');
      if (onUpdate) onUpdate();
      navigation.goBack();
    } catch (error) { Alert.alert('Ошибка', 'Не удалось обновить'); } finally { setSaving(false); }
  };

  const deleteAppointment = () => {
    Alert.alert('Удалить запись?', '', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        await cancelAppointmentReminder(appointment.id);
        await deleteAppointmentLocal(appointment.id);
        if (onUpdate) onUpdate();
        navigation.goBack();
      }}
    ]);
  };

  const callClient = () => { if (!phone) return; Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Ошибка', 'Не удалось позвонить')); };
  
  const messageClient = () => {
    if (!phone) return;
    Alert.alert('📱 Написать', 'Выберите способ', [
      { text: 'Отмена', style: 'cancel' },
      { text: '💬 WhatsApp', onPress: async () => { const url = `whatsapp://send?phone=${normalizePhone(phone)}`; const s = await Linking.canOpenURL(url); if (s) await Linking.openURL(url); else Alert.alert('Ошибка', 'WhatsApp не установлен'); }},
      { text: '📱 SMS', onPress: async () => { const isAv = await SMS.isAvailableAsync(); if (isAv) await SMS.sendSMSAsync([phone], ''); else Alert.alert('Ошибка', 'SMS недоступны'); }}
    ]);
  };

  const sendReminder = () => {
    if (!isClient) return;
    const address = getAddressByCity(city);
    const message = formatTemplate(REMINDER_TEMPLATES.day_before, { 
      clientName, 
      service: service || 'услуга', 
      date: formatDate(date), 
      time, 
      price,
      address: address
    });
    Alert.alert('📱 Отправить напоминание', 'Выберите способ', [
      { text: 'Отмена', style: 'cancel' },
      { text: '📱 SMS', onPress: async () => { const isAv = await SMS.isAvailableAsync(); if (isAv) { await SMS.sendSMSAsync([phone], message); await updateAppointmentLocal(appointment.id, { reminderSent: true }); } }},
      { text: '💬 WhatsApp', onPress: async () => { const url = `whatsapp://send?phone=${normalizePhone(phone)}&text=${encodeURIComponent(message)}`; const s = await Linking.canOpenURL(url); if (s) { await Linking.openURL(url); await updateAppointmentLocal(appointment.id, { reminderSent: true }); } }}
    ]);
  };

  const getHeaderColor = () => {
    if (isClient) return '#E74C3C';
    if (isPersonal) return '#27AE60';
    return '#F39C12';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.topBar, { backgroundColor: getHeaderColor() + '20' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={[styles.backBtnText, { color: getHeaderColor() }]}>←</Text></TouchableOpacity>
        <Text style={styles.topBarTitle}>{isClient ? 'Редактировать' : (isPersonal ? 'Личная запись' : 'Перерыв')}</Text>
        <View style={styles.topBarActions}>
          {isClient && (
            <>
              <TouchableOpacity onPress={callClient} style={styles.actionBtn}><Text style={styles.actionBtnText}>📞</Text></TouchableOpacity>
              <TouchableOpacity onPress={messageClient} style={styles.actionBtn}><Text style={styles.actionBtnText}>💬</Text></TouchableOpacity>
            </>
          )}
          <TouchableOpacity onPress={deleteAppointment}><Text style={[styles.deleteBtn, { color: getHeaderColor() }]}>🗑️</Text></TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          {isClient ? (
            <>
              <Text style={styles.label}>Имя</Text><TextInput style={styles.input} value={clientName} onChangeText={setClientName} placeholderTextColor="#555555" />
              <Text style={styles.label}>Фамилия</Text><TextInput style={styles.input} value={clientSurname} onChangeText={setClientSurname} placeholderTextColor="#555555" />
              <Text style={styles.label}>Телефон</Text><TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor="#555555" />
              <Text style={styles.label}>Услуга (необязательно)</Text><TextInput style={styles.input} value={service} onChangeText={setService} placeholderTextColor="#555555" />
              <Text style={styles.label}>Город</Text>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowCityPickerModal(true)}><Text style={styles.pickerBtnText}>{city || 'Выберите город'}</Text><Text style={styles.pickerBtnIcon}>🏙️</Text></TouchableOpacity>
            </>
          ) : isPersonal ? (
            <>
              <Text style={styles.label}>Заголовок</Text><TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor="#555555" />
              <Text style={styles.label}>Описание</Text><TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline numberOfLines={4} placeholderTextColor="#555555" />
            </>
          ) : (
            <>
              <Text style={styles.label}>Длительность (мин)</Text><TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="numeric" placeholderTextColor="#555555" />
              <Text style={styles.label}>Примечание</Text><TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline numberOfLines={2} placeholderTextColor="#555555" />
            </>
          )}
          <Text style={styles.label}>Дата</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowCalendar(!showCalendar)}><Text style={styles.pickerBtnText}>{date ? formatDate(date) : 'Выберите дату'}</Text><Text style={styles.pickerBtnIcon}>📅</Text></TouchableOpacity>
          {showCalendar && <Calendar onDayPress={(day) => { setDate(day.dateString); setShowCalendar(false); }} markedDates={{ [date]: { selected: true, selectedColor: getHeaderColor() } }} theme={{ backgroundColor: '#1C1C1E', calendarBackground: '#1C1C1E', selectedDayBackgroundColor: getHeaderColor(), todayTextColor: getHeaderColor(), arrowColor: getHeaderColor(), monthTextColor: '#FFFFFF', dayTextColor: '#FFFFFF', textDisabledColor: '#555555' }} style={styles.inlineCalendar} />}
          <Text style={styles.label}>Время</Text><TimeSelector value={time} onSelect={setTime} />
          {isClient && (
            <>
              <Text style={styles.label}>Стоимость</Text><TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholderTextColor="#555555" />
              <Text style={styles.label}>Комментарий</Text><TextInput style={[styles.input, styles.textArea]} value={comment} onChangeText={setComment} multiline numberOfLines={3} placeholderTextColor="#555555" />
            </>
          )}
          {isClient && (
            <TouchableOpacity style={[styles.remindBtn, { backgroundColor: getHeaderColor() }]} onPress={sendReminder}><Text style={styles.remindBtnText}>📱 Отправить напоминание</Text></TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: getHeaderColor() }]} onPress={update} disabled={saving}><Text style={styles.saveBtnText}>{saving ? 'Сохранение...' : '💾 Сохранить'}</Text></TouchableOpacity>
        </View>
      </ScrollView>
      <Modal visible={showCityPickerModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCityPickerModal(false)}>
          <View style={styles.contextMenu}>{CITIES.map(c => <TouchableOpacity key={c} style={styles.contextMenuItem} onPress={() => { setCity(c); setShowCityPickerModal(false); }}><Text style={[styles.contextMenuText, city === c && styles.contextMenuTextActive]}>{c} {city === c ? '✓' : ''}</Text></TouchableOpacity>)}</View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1C1E' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#3A3A3C' },
  backBtn: { padding: 5 },
  backBtnText: { fontSize: 24, fontWeight: '600' },
  topBarTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  topBarActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 8 },
  actionBtnText: { fontSize: 22 },
  deleteBtn: { fontSize: 22, padding: 5 },
  formContainer: { flex: 1, padding: 15 },
  formCard: { backgroundColor: '#2C2C2E', borderRadius: 16, padding: 20, marginBottom: 30 },
  label: { fontSize: 13, fontWeight: '600', color: '#9B59B6', marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#1C1C1E', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#3A3A3C', fontSize: 16, color: '#FFFFFF' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  pickerBtn: { backgroundColor: '#1C1C1E', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#3A3A3C', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerBtnText: { fontSize: 16, color: '#FFFFFF' },
  pickerBtnIcon: { fontSize: 20 },
  inlineCalendar: { marginTop: 10, borderRadius: 12 },
  saveBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  remindBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  remindBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  contextMenu: { backgroundColor: '#2C2C2E', borderRadius: 15, padding: 10, width: 260 },
  contextMenuItem: { paddingVertical: 14, paddingHorizontal: 20 },
  contextMenuText: { fontSize: 16, color: '#FFFFFF' },
  contextMenuTextActive: { color: '#9B59B6', fontWeight: '700' },
});