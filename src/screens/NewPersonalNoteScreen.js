import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, SafeAreaView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { COLORS } from '../config/colors';
import { formatDate } from '../config/constants';
import { addAppointmentLocal } from '../config/storage';
import { TimeSelector } from '../components/TimePicker';

export const NewPersonalNoteScreen = ({ route, navigation }) => {
  const { selectedDate, onSave } = route.params || {};
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const save = async () => {
    if (!title || !date || !time) { Alert.alert('Ошибка', 'Заполните обязательные поля'); return; }
    setSaving(true);
    try {
      await addAppointmentLocal({ type: 'personal', title: title.trim(), description: description.trim(), date: date.trim(), time: time.trim() });
      Alert.alert('Успех', 'Личная запись добавлена');
      if (onSave) onSave();
      navigation.goBack();
    } catch (error) { Alert.alert('Ошибка', 'Не удалось сохранить'); } finally { setSaving(false); }
  };

  return (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
      <SafeAreaView>
        <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backButton}>← Назад</Text></TouchableOpacity><Text style={styles.headerTitle}>Личная запись</Text><View style={{ width: 60 }} /></View>
        <View style={styles.formCard}>
          <Text style={styles.label}>📝 Заголовок *</Text><TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Например: Закупка материалов" placeholderTextColor={COLORS.textLight} />
          <Text style={styles.label}>📅 Дата *</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(!showCalendar)}><Text style={styles.dateButtonText}>{date ? formatDate(date) : 'Выберите дату'}</Text><Text style={styles.calendarIcon}>📅</Text></TouchableOpacity>
          {showCalendar && <Calendar onDayPress={(day) => { setDate(day.dateString); setShowCalendar(false); }} markedDates={{ [date]: { selected: true, selectedColor: COLORS.success } }} theme={{ selectedDayBackgroundColor: COLORS.success, todayTextColor: COLORS.success, arrowColor: COLORS.success }} style={styles.inlineCalendar} />}
          <Text style={styles.label}>⏰ Время *</Text><TimeSelector value={time} onSelect={setTime} />
          <Text style={styles.label}>📄 Описание</Text>
          <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Дополнительная информация..." multiline numberOfLines={4} placeholderTextColor={COLORS.textLight} />
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: COLORS.success }]} onPress={save} disabled={saving}><Text style={styles.saveButtonText}>{saving ? 'Сохранение...' : '✓ Сохранить'}</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  formContainer: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: COLORS.headerBg },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  backButton: { fontSize: 16, color: '#FFFFFF', fontWeight: '500' },
  formCard: { backgroundColor: COLORS.cardBg, marginHorizontal: 15, marginTop: 15, marginBottom: 30, paddingVertical: 20, borderRadius: 20 },
  label: { marginHorizontal: 20, marginBottom: 5, marginTop: 10, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  input: { backgroundColor: COLORS.background, marginHorizontal: 20, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, fontSize: 16, color: COLORS.textPrimary },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  dateButton: { backgroundColor: COLORS.background, marginHorizontal: 20, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateButtonText: { fontSize: 16, color: COLORS.textPrimary },
  calendarIcon: { fontSize: 20 },
  inlineCalendar: { marginHorizontal: 20, marginBottom: 10, borderRadius: 15 },
  saveButton: { marginHorizontal: 20, marginTop: 20, padding: 16, borderRadius: 15, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});