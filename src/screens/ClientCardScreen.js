import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { formatShortDate, normalizePhone } from '../config/constants';
import { loadFromStorage, saveClientInfo, loadClientInfo, isClientAppointment } from '../config/storage';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { COLORS } from '../config/colors';
import { commonStyles } from '../theme/commonStyles';

export const ClientCardScreen = ({ route, navigation }) => {
  const client = route.params?.client;
  const [history, setHistory] = useState([]);
  const [notes, setNotes] = useState('');
  const [allergies, setAllergies] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showAllergies, setShowAllergies] = useState(false);

  const loadData = useCallback(async () => {
    if (!client?.phone) return;
    const apps = await loadFromStorage();
    const clientApps = apps.filter((a) => {
      const phone = a.clientPhoneNormalized || normalizePhone(a.clientPhone || '');
      return phone === client.phone && isClientAppointment(a);
    });
    clientApps.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const info = await loadClientInfo(client.phone);
    return { clientApps, info };
  }, [client?.phone]);

  useFocusEffect(
    useCallback(() => {
      if (!client?.phone) {
        Alert.alert('Ошибка', 'Клиент не найден', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        return undefined;
      }
      let active = true;
      loadData().then(({ clientApps, info }) => {
        if (!active) return;
        setHistory(clientApps);
        setNotes(info.notes || '');
        setAllergies(info.allergies || '');
        setIsBlocked(info.isBlocked || false);
      }).catch(() => {
        if (active) Alert.alert('Ошибка', 'Не удалось загрузить данные клиента');
      });
      return () => { active = false; };
    }, [client?.phone, loadData, navigation])
  );

  if (!client?.phone) {
    return null;
  }

  const saveClientInfoHandler = async () => {
    try {
      await saveClientInfo(client.phone, { notes, allergies, isBlocked });
      Alert.alert('Сохранено', 'Информация о клиенте обновлена');
    } catch {
      Alert.alert('Ошибка', 'Не удалось сохранить');
    }
  };

  const toggleBlock = async () => {
    const newValue = !isBlocked;
    setIsBlocked(newValue);
    try {
      await saveClientInfo(client.phone, { notes, allergies, isBlocked: newValue });
    } catch {
      setIsBlocked(!newValue);
      Alert.alert('Ошибка', 'Не удалось изменить статус');
    }
  };

  const totalSpent = history.reduce((s, a) => s + (a.price || 0), 0);
  const cancelledCount = history.filter((a) => a.status === 'cancelled').length;

  return (
    <SafeAreaView style={commonStyles.screen}>
      <ScreenHeader
        title="Карточка клиента"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity onPress={saveClientInfoHandler}>
            <Text style={{ fontSize: 22 }}>💾</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.clientName}>{client.name} {client.surname || ''}</Text>
          <Text style={styles.clientPhone}>{client.phone}</Text>
          {isBlocked && (
            <View style={styles.blockedBadge}>
              <Text style={styles.blockedBadgeText}>🚫 Заблокирован</Text>
            </View>
          )}
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: COLORS.successLight }]}>
            <Text style={styles.statNumber}>{history.filter((a) => a.status !== 'cancelled').length}</Text>
            <Text style={styles.statLabel}>Визитов</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: COLORS.secondary }]}>
            <Text style={styles.statNumber}>{totalSpent} ₽</Text>
            <Text style={styles.statLabel}>Потрачено</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: COLORS.dangerLight }]}>
            <Text style={styles.statNumber}>{cancelledCount}</Text>
            <Text style={styles.statLabel}>Отмен</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowNotes(!showNotes)}>
            <Text style={styles.actionBtnText}>📝 Заметки</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowAllergies(!showAllergies)}>
            <Text style={styles.actionBtnText}>⚠️ Аллергии</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, isBlocked && styles.actionBtnActive]}
            onPress={toggleBlock}
          >
            <Text style={styles.actionBtnText}>{isBlocked ? '✅ Разблок.' : '🚫 Блок'}</Text>
          </TouchableOpacity>
        </View>

        {showNotes && (
          <View style={styles.inputCard}>
            <Text style={styles.label}>Заметки</Text>
            <TextInput
              style={styles.input}
              value={notes}
              onChangeText={setNotes}
              placeholder="Особенности клиента..."
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={3}
            />
          </View>
        )}
        {showAllergies && (
          <View style={styles.inputCard}>
            <Text style={styles.label}>Аллергии и противопоказания</Text>
            <TextInput
              style={styles.input}
              value={allergies}
              onChangeText={setAllergies}
              placeholder="Аллергии, реакции..."
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>📜 История посещений</Text>
          {history.length === 0 ? (
            <Text style={styles.emptyText}>Нет записей</Text>
          ) : (
            history.map((item, index) => (
              <View key={item.id || index} style={[styles.historyCard, item.status === 'cancelled' && styles.cancelledCard]}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyDate}>{formatShortDate(item.date)} в {item.time}</Text>
                  {item.status === 'cancelled' && <Text style={styles.cancelledText}>Отменена</Text>}
                </View>
                <Text style={styles.historyService}>{item.service}</Text>
                {item.price > 0 && <Text style={styles.historyPrice}>{item.price} ₽</Text>}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  profileCard: { alignItems: 'center', padding: 20, backgroundColor: COLORS.cardBg, marginHorizontal: 15, marginTop: 15, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { fontSize: 40 },
  clientName: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  clientPhone: { fontSize: 15, color: COLORS.textSecondary, marginTop: 5 },
  blockedBadge: { backgroundColor: COLORS.dangerLight, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 15, marginTop: 10 },
  blockedBadgeText: { color: COLORS.danger, fontSize: 13, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 15, marginTop: 15 },
  statBox: { flex: 1, padding: 15, borderRadius: 14, alignItems: 'center', marginHorizontal: 4 },
  statNumber: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  actionsRow: { flexDirection: 'row', paddingHorizontal: 15, marginTop: 15 },
  actionBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: COLORS.cardBg, alignItems: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: COLORS.border },
  actionBtnActive: { backgroundColor: COLORS.dangerLight, borderColor: COLORS.danger },
  actionBtnText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
  inputCard: { backgroundColor: COLORS.cardBg, marginHorizontal: 15, marginTop: 15, padding: 15, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.primary, marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: COLORS.inputBg, padding: 12, borderRadius: 10, fontSize: 14, color: COLORS.textPrimary, minHeight: 60, textAlignVertical: 'top', borderWidth: 1, borderColor: COLORS.border },
  historySection: { padding: 15 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  historyCard: { backgroundColor: COLORS.cardBg, padding: 14, borderRadius: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: COLORS.primary, borderWidth: 1, borderColor: COLORS.border },
  cancelledCard: { opacity: 0.5, borderLeftColor: COLORS.danger },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  historyDate: { fontSize: 13, color: COLORS.textSecondary },
  cancelledText: { fontSize: 12, color: COLORS.danger, fontWeight: '600' },
  historyService: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
  historyPrice: { fontSize: 14, color: COLORS.success, fontWeight: '700', marginTop: 4 },
  emptyText: { color: COLORS.textLight, textAlign: 'center', marginTop: 20 },
});
