import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Alert, SafeAreaView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadMessageTemplates, saveMessageTemplates, resetMessageTemplates } from '../config/templates';
import { TemplateEditor } from '../components/templates/TemplateEditor';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { COLORS } from '../config/colors';
import { commonStyles } from '../theme/commonStyles';

export const TemplatesScreen = ({ navigation }) => {
  const [dayBefore, setDayBefore] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const t = await loadMessageTemplates();
    setDayBefore(t.day_before || '');
    setConfirmation(t.confirmation || '');
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const insertAtEnd = (setter, current, variable) => {
    const spacer = current && !current.endsWith(' ') && !current.endsWith('\n') ? ' ' : '';
    setter(current ? `${current}${spacer}${variable}` : variable);
  };

  const save = async () => {
    if (!dayBefore.trim() || !confirmation.trim()) {
      Alert.alert('Заполните тексты', 'Оба сообщения должны содержать текст');
      return;
    }
    setSaving(true);
    try {
      await saveMessageTemplates({ day_before: dayBefore.trim(), confirmation: confirmation.trim() });
      Alert.alert('Готово', 'Тексты сообщений сохранены');
    } catch {
      Alert.alert('Ошибка', 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    Alert.alert('Вернуть стандартные тексты?', 'Ваши изменения будут заменены', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Вернуть', style: 'destructive', onPress: async () => {
        const t = await resetMessageTemplates();
        setDayBefore(t.day_before);
        setConfirmation(t.confirmation);
      }},
    ]);
  };

  return (
    <SafeAreaView style={commonStyles.screen}>
      <ScreenHeader title="Тексты SMS" onBack={() => navigation.goBack()} backLabel="← Назад" backStyle="text" />
      <ScrollView style={commonStyles.formContainer} keyboardShouldPersistTaps="handled">
        <View style={introCard}>
          <Text style={introTitle}>Здесь вы редактируете тексты</Text>
          <Text style={introText}>Имя, дата, время и адрес подставятся сами. Ниже — пример для клиента.</Text>
        </View>
        <TemplateEditor icon="🔔" title="Напоминание накануне" when="Кнопка «Напомнить» — за день до визита" text={dayBefore} onChangeText={setDayBefore} onInsert={(v) => insertAtEnd(setDayBefore, dayBefore, v)} />
        <TemplateEditor icon="✅" title="Подтверждение записи" when="Сразу после создания новой записи" text={confirmation} onChangeText={setConfirmation} onInsert={(v) => insertAtEnd(setConfirmation, confirmation, v)} />
        <TouchableOpacity onPress={reset} style={{ alignItems: 'center', paddingVertical: 12 }}>
          <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>↺ Вернуть стандартные тексты</Text>
        </TouchableOpacity>
        <PrimaryButton title={saving ? 'Сохранение...' : 'Сохранить'} onPress={save} disabled={saving} style={{ marginBottom: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const introCard = { backgroundColor: COLORS.secondary, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.primaryLight };
const introTitle = { fontSize: 16, fontWeight: '700', color: COLORS.primaryDark, marginBottom: 6 };
const introText = { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 };
