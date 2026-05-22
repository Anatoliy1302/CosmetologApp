import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Alert } from 'react-native';
import { formatDate, formatShortDate, normalizePhone } from '../config/constants';
import { loadFromStorage, updateAppointmentLocal } from '../config/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ClientCardScreen = ({ route, navigation }) => {
  const { client } = route.params;
  const [history, setHistory] = useState([]);
  const [notes, setNotes] = useState('');
  const [allergies, setAllergies] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showAllergies, setShowAllergies] = useState(false);

  useEffect(() => {
    loadClientHistory();
    loadClientInfo();
  }, []);

  const loadClientHistory = async () => {
    const apps = await loadFromStorage();
    const clientApps = apps.filter(a => {
      const phone = a.clientPhoneNormalized || normalizePhone(a.clientPhone || '');
      return phone === client.phone && (a.type === 'client' || !a.type);
    });
    clientApps.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    setHistory(clientApps);
  };

  const loadClientInfo = async () => {
    const info = JSON.parse(await AsyncStorage.getItem(`@client_${client.phone}`) || '{}');
    setNotes(info.notes || '');
    setAllergies(info.allergies || '');
    setIsBlocked(info.isBlocked || false);
  };

  const saveClientInfo = async () => {
    await AsyncStorage.setItem(`@client_${client.phone}`, JSON.stringify({ notes, allergies, isBlocked }));
    Alert.alert('Сохранено', 'Информация о клиенте обновлена');
  };

  const toggleBlock = async () => {
    const newValue = !isBlocked;
    setIsBlocked(newValue);
    await AsyncStorage.setItem(`@client_${client.phone}`, JSON.stringify({ notes, allergies, isBlocked: newValue }));
  };

  const totalSpent = history.reduce((s, a) => s + (a.price || 0), 0);
  const cancelledCount = history.filter(a => a.status === 'cancelled').length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Карточка клиента</Text>
        <TouchableOpacity onPress={saveClientInfo}>
          <Text style={styles.saveBtn}>💾</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Профиль клиента */}
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

        {/* Статистика */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: '#27AE6020' }]}>
            <Text style={styles.statNumber}>{history.filter(a => a.status !== 'cancelled').length}</Text>
            <Text style={styles.statLabel}>Визитов</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#9B59B620' }]}>
            <Text style={styles.statNumber}>{totalSpent} ₽</Text>
            <Text style={styles.statLabel}>Потрачено</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#E74C3C20' }]}>
            <Text style={styles.statNumber}>{cancelledCount}</Text>
            <Text style={styles.statLabel}>Отмен</Text>
          </View>
        </View>

        {/* Кнопки действий */}
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

        {/* Поля заметок и аллергий */}
        {showNotes && (
          <View style={styles.inputCard}>
            <Text style={styles.label}>Заметки</Text>
            <TextInput 
              style={styles.input} 
              value={notes} 
              onChangeText={setNotes} 
              placeholder="Особенности клиента..." 
              placeholderTextColor="#555555" 
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
              placeholderTextColor="#555555" 
              multiline 
              numberOfLines={3} 
            />
          </View>
        )}

        {/* История посещений */}
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
  container: { flex: 1, backgroundColor: '#1C1C1E' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#2C2C2E', borderBottomWidth: 1, borderBottomColor: '#3A3A3C' },
  backBtn: { padding: 5 },
  backBtnText: { fontSize: 24, color: '#9B59B6', fontWeight: '600' },
  topBarTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  saveBtn: { fontSize: 22 },
  profileCard: { alignItems: 'center', padding: 20, backgroundColor: '#2C2C2E', marginHorizontal: 15, marginTop: 15, borderRadius: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#9B59B620', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { fontSize: 40 },
  clientName: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  clientPhone: { fontSize: 15, color: '#AAAAAA', marginTop: 5 },
  blockedBadge: { backgroundColor: '#E74C3C20', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 15, marginTop: 10 },
  blockedBadgeText: { color: '#E74C3C', fontSize: 13, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 15, marginTop: 15 },
  statBox: { flex: 1, padding: 15, borderRadius: 14, alignItems: 'center', marginHorizontal: 4 },
  statNumber: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  statLabel: { fontSize: 11, color: '#AAAAAA', marginTop: 4 },
  actionsRow: { flexDirection: 'row', paddingHorizontal: 15, marginTop: 15 },
  actionBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#2C2C2E', alignItems: 'center', marginHorizontal: 4 },
  actionBtnActive: { backgroundColor: '#E74C3C20' },
  actionBtnText: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
  inputCard: { backgroundColor: '#2C2C2E', marginHorizontal: 15, marginTop: 15, padding: 15, borderRadius: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#9B59B6', marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#1C1C1E', padding: 12, borderRadius: 10, fontSize: 14, color: '#FFFFFF', minHeight: 60, textAlignVertical: 'top' },
  historySection: { padding: 15 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 },
  historyCard: { backgroundColor: '#2C2C2E', padding: 14, borderRadius: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#9B59B6' },
  cancelledCard: { opacity: 0.5, borderLeftColor: '#E74C3C' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  historyDate: { fontSize: 13, color: '#AAAAAA' },
  cancelledText: { fontSize: 12, color: '#E74C3C', fontWeight: '600' },
  historyService: { fontSize: 15, color: '#FFFFFF', fontWeight: '500' },
  historyPrice: { fontSize: 14, color: '#27AE60', fontWeight: '700', marginTop: 4 },
  emptyText: { color: '#8E8E93', textAlign: 'center', marginTop: 20 },
});