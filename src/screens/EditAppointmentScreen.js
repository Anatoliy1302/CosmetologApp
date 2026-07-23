import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, SafeAreaView } from 'react-native';
import { CITIES, normalizePhone } from '../config/constants';
import { updateAppointmentLocal, deleteAppointmentLocal, isClientAppointment } from '../config/storage';
import { callPhone, sendSms, openWhatsApp } from '../config/messaging';
import { useReminderMessage } from '../hooks/useReminderMessage';
import { TimeSelector } from '../components/TimePicker';
import { CityPickerModal } from '../components/forms/CityPickerModal';
import { DatePickerField } from '../components/forms/DatePickerField';
import { scheduleAppointmentReminder, cancelAppointmentReminder } from '../config/notifications';
import { COLORS, APPOINTMENT } from '../config/colors';
import { commonStyles } from '../theme/commonStyles';

export const EditAppointmentScreen = ({ route, navigation }) => {
  const { appointment, onUpdate } = route.params || {};
  const isClient = isClientAppointment(appointment);
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
  const [showCityPickerModal, setShowCityPickerModal] = useState(false);

  const { sendDayBeforeReminder } = useReminderMessage();

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
        try {
          await cancelAppointmentReminder(appointment.id);
          await deleteAppointmentLocal(appointment.id);
          if (onUpdate) onUpdate();
          navigation.goBack();
        } catch {
          Alert.alert('Ошибка', 'Не удалось удалить запись');
        }
      }}
    ]);
  };

  const cancelClientAppointment = () => {
    if (!isClient) return;
    const isCancelled = appointment.status === 'cancelled';
    Alert.alert(isCancelled ? 'Восстановить запись?' : 'Отменить запись?', '', [
      { text: 'Нет', style: 'cancel' },
      { text: isCancelled ? 'Восстановить' : 'Отменить', onPress: async () => {
        try {
          await updateAppointmentLocal(appointment.id, { status: isCancelled ? 'active' : 'cancelled' });
          if (onUpdate) onUpdate();
          navigation.goBack();
        } catch {
          Alert.alert('Ошибка', 'Не удалось изменить статус записи');
        }
      }}
    ]);
  };

  const callClient = () => callPhone(phone);

  const messageClient = () => {
    if (!phone) return;
    Alert.alert('📱 Написать', 'Выберите способ', [
      { text: 'Отмена', style: 'cancel' },
      { text: '💬 WhatsApp', onPress: () => openWhatsApp(phone) },
      { text: '📱 SMS', onPress: () => sendSms(phone) },
    ]);
  };

  const sendReminder = () => {
    if (!isClient) return;
    sendDayBeforeReminder({
      ...appointment,
      clientName,
      clientPhone: phone,
      clientCity: city,
      service,
      date,
      time,
      price,
    });
  };
  const getHeaderColor = () => {
    if (isClient) return APPOINTMENT.client.accent;
    if (isPersonal) return APPOINTMENT.personal.accent;
    return APPOINTMENT.break.accent;
  };

  if (!appointment?.id) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Запись не найдена</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text>← Назад</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.topBar, { backgroundColor: getHeaderColor() + '20' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={[styles.backBtnText, { color: getHeaderColor() }]}>←</Text></TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: COLORS.textPrimary }]}>{isClient ? 'Редактировать' : (isPersonal ? 'Личная запись' : 'Перерыв')}</Text>
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
              <Text style={styles.label}>Имя</Text><TextInput style={styles.input} value={clientName} onChangeText={setClientName} placeholderTextColor={COLORS.textLight} />
              <Text style={styles.label}>Фамилия</Text><TextInput style={styles.input} value={clientSurname} onChangeText={setClientSurname} placeholderTextColor={COLORS.textLight} />
              <Text style={styles.label}>Телефон</Text><TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={COLORS.textLight} />
              <Text style={styles.label}>Услуга (необязательно)</Text><TextInput style={styles.input} value={service} onChangeText={setService} placeholderTextColor={COLORS.textLight} />
              <Text style={commonStyles.label}>Город</Text>
              <TouchableOpacity style={commonStyles.pickerBtn} onPress={() => setShowCityPickerModal(true)}>
                <Text style={commonStyles.pickerBtnText}>{city || 'Выберите город'}</Text>
                <Text style={commonStyles.pickerBtnIcon}>🏙️</Text>
              </TouchableOpacity>
            </>
          ) : isPersonal ? (
            <>
              <Text style={styles.label}>Заголовок</Text><TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor={COLORS.textLight} />
              <Text style={styles.label}>Описание</Text><TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline numberOfLines={4} placeholderTextColor={COLORS.textLight} />
            </>
          ) : (
            <>
              <Text style={styles.label}>Длительность (мин)</Text><TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="numeric" placeholderTextColor={COLORS.textLight} />
              <Text style={styles.label}>Примечание</Text><TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline numberOfLines={2} placeholderTextColor={COLORS.textLight} />
            </>
          )}
          <DatePickerField label="Дата" date={date} onChangeDate={setDate} accentColor={getHeaderColor()} />
          <Text style={commonStyles.label}>Время</Text><TimeSelector value={time} onSelect={setTime} />
          {isClient && (
            <>
              <Text style={styles.label}>Стоимость</Text><TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholderTextColor={COLORS.textLight} />
              <Text style={styles.label}>Комментарий</Text><TextInput style={[styles.input, styles.textArea]} value={comment} onChangeText={setComment} multiline numberOfLines={3} placeholderTextColor={COLORS.textLight} />
            </>
          )}
          {isClient && (
            <>
              <TouchableOpacity style={[styles.cancelBtn, appointment.status === 'cancelled' && styles.cancelBtnActive]} onPress={cancelClientAppointment}>
                <Text style={styles.cancelBtnText}>{appointment.status === 'cancelled' ? '✅ Восстановить запись' : '❌ Отменить запись'}</Text>
              </TouchableOpacity>
              {appointment.status !== 'cancelled' && (
                <TouchableOpacity style={[styles.remindBtn, { backgroundColor: getHeaderColor() }]} onPress={sendReminder}><Text style={styles.remindBtnText}>📱 Отправить напоминание</Text></TouchableOpacity>
              )}
            </>
          )}
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: getHeaderColor() }]} onPress={update} disabled={saving}><Text style={styles.saveBtnText}>{saving ? 'Сохранение...' : '💾 Сохранить'}</Text></TouchableOpacity>
        </View>
      </ScrollView>
      <CityPickerModal
        visible={showCityPickerModal}
        selectedCity={city}
        onSelect={setCity}
        onClose={() => setShowCityPickerModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.cardBg },
  backBtn: { padding: 5 },
  backBtnText: { fontSize: 24, fontWeight: '600' },
  topBarTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },
  topBarActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 8 },
  actionBtnText: { fontSize: 22 },
  deleteBtn: { fontSize: 22, padding: 5 },
  formContainer: { flex: 1, padding: 15 },
  formCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: COLORS.border },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.primary, marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: COLORS.inputBg, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, fontSize: 16, color: COLORS.textPrimary },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  pickerBtn: { backgroundColor: COLORS.inputBg, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerBtnText: { fontSize: 16, color: COLORS.textPrimary },
  pickerBtnIcon: { fontSize: 20 },
  inlineCalendar: { marginTop: 10, borderRadius: 12 },
  saveBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: COLORS.textOnPrimary, fontSize: 17, fontWeight: '700' },
  remindBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  remindBtnText: { color: COLORS.textOnPrimary, fontSize: 16, fontWeight: '600' },
  cancelBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 15, backgroundColor: COLORS.surfaceAlt },
  cancelBtnActive: { backgroundColor: COLORS.successLight },
  cancelBtnText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
});