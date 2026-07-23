import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert, SafeAreaView } from 'react-native';
import { toLocalDateString } from '../config/constants';
import { addAppointmentLocal } from '../config/storage';
import { TimeSelector } from '../components/TimePicker';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { DatePickerField } from '../components/forms/DatePickerField';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { COLORS } from '../config/colors';
import { commonStyles } from '../theme/commonStyles';

const NOTE_CONFIG = {
  personal: {
    title: 'Личная запись',
    accent: COLORS.success,
    fields: ['title', 'description'],
    defaultTitle: '',
    saveLabel: '✓ Сохранить',
    successMsg: 'Личная запись добавлена',
    buildPayload: ({ title, description, date, time }) => ({
      type: 'personal',
      title: title.trim(),
      description: description.trim(),
      date: date.trim(),
      time: time.trim(),
    }),
    validate: ({ title }) => {
      if (!title?.trim()) { Alert.alert('Ошибка', 'Заполните заголовок'); return false; }
      return true;
    },
  },
  break: {
    title: 'Перерыв',
    accent: COLORS.warning,
    fields: ['duration', 'description'],
    defaultTitle: 'Перерыв',
    saveLabel: '✓ Сохранить',
    successMsg: 'Перерыв добавлен',
    buildPayload: ({ description, date, time, duration }) => ({
      type: 'break',
      title: 'Перерыв',
      description: description.trim() || `Перерыв ${duration} мин`,
      date: date.trim(),
      time: time.trim(),
      duration: parseInt(duration, 10) || 30,
    }),
    validate: () => true,
  },
};

export const NewNoteScreen = ({ route, navigation }) => {
  const { type = 'personal', selectedDate, onSave } = route.params || {};
  const config = NOTE_CONFIG[type] || NOTE_CONFIG.personal;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(selectedDate || toLocalDateString());
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!date || !time) { Alert.alert('Ошибка', 'Выберите дату и время'); return; }
    if (type === 'personal' && !config.validate({ title })) return;
    setSaving(true);
    try {
      await addAppointmentLocal(config.buildPayload({ title, description, date, time, duration }));
      Alert.alert('Успех', config.successMsg);
      onSave?.();
      navigation.goBack();
    } catch {
      Alert.alert('Ошибка', 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.screen}>
      <ScreenHeader title={config.title} onBack={() => navigation.goBack()} />
      <ScrollView style={commonStyles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={commonStyles.formCard}>
          {type === 'personal' && (
            <>
              <Text style={commonStyles.label}>Заголовок *</Text>
              <TextInput style={commonStyles.input} value={title} onChangeText={setTitle} placeholder="Например: Закупка материалов" placeholderTextColor={COLORS.textLight} />
              <Text style={commonStyles.label}>Описание</Text>
              <TextInput style={[commonStyles.input, commonStyles.textArea]} value={description} onChangeText={setDescription} placeholder="Дополнительная информация..." multiline numberOfLines={4} placeholderTextColor={COLORS.textLight} />
            </>
          )}
          {type === 'break' && (
            <>
              <Text style={commonStyles.label}>Длительность (минут)</Text>
              <TextInput style={commonStyles.input} value={duration} onChangeText={setDuration} placeholder="30" keyboardType="numeric" placeholderTextColor={COLORS.textLight} />
              <Text style={commonStyles.label}>Примечание</Text>
              <TextInput style={[commonStyles.input, commonStyles.textArea]} value={description} onChangeText={setDescription} placeholder="Например: Обед" multiline numberOfLines={2} placeholderTextColor={COLORS.textLight} />
            </>
          )}
          <DatePickerField label="Дата *" date={date} onChangeDate={setDate} accentColor={config.accent} />
          <Text style={commonStyles.label}>Время *</Text>
          <TimeSelector value={time} onSelect={setTime} />
          <PrimaryButton title={saving ? 'Сохранение...' : config.saveLabel} onPress={save} disabled={saving} color={config.accent} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
