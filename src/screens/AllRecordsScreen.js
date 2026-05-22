import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Linking, Alert, Animated, PanResponder } from 'react-native';
import * as SMS from 'expo-sms';
import { formatShortDate, normalizePhone } from '../config/constants';
import { loadFromStorage, deleteAppointmentLocal } from '../config/storage';

const CLIENT_COLORS = [
  '#3D1F2E', '#2E3D1F', '#1F2E3D', '#3D2E1F', '#2E1F3D',
  '#1F3D2E', '#3D3D1F', '#1F3D3D', '#3D1F1F', '#1F1F3D',
];

const getClientColor = (phone) => {
  if (!phone) return CLIENT_COLORS[0];
  const sum = phone.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CLIENT_COLORS[sum % CLIENT_COLORS.length];
};

export const AllRecordsScreen = ({ navigation }) => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [priceSort, setPriceSort] = useState('none');
  const [showFilters, setShowFilters] = useState(false);

  const loadRecords = async () => {
    const data = await loadFromStorage();
    data.sort((a, b) => {
      if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
      return (a.time || '').localeCompare(b.time || '');
    });
    setRecords(data);
    applyFilters(data, search, filterType, dateFilter, priceSort);
    setLoading(false);
  };

  useEffect(() => { loadRecords(); }, []);

  const applyFilters = (list, searchText, type, dateF, priceS) => {
    let filtered = [...list];
    if (type === 'clients') filtered = filtered.filter(r => r.type === 'client' || !r.type);
    else if (type === 'personal') filtered = filtered.filter(r => r.type === 'personal');
    else if (type === 'breaks') filtered = filtered.filter(r => r.type === 'break');
    const today = new Date().toISOString().split('T')[0];
    if (dateF === 'today') filtered = filtered.filter(r => r.date === today);
    else if (dateF === 'week') {
      const ws = new Date(); ws.setDate(ws.getDate() - ws.getDay() + (ws.getDay() === 0 ? -6 : 1));
      const we = new Date(ws); we.setDate(ws.getDate() + 6);
      filtered = filtered.filter(r => r.date && r.date >= ws.toISOString().split('T')[0] && r.date <= we.toISOString().split('T')[0]);
    } else if (dateF === 'month') {
      const m = new Date().toISOString().slice(0, 7);
      filtered = filtered.filter(r => r.date?.startsWith(m));
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(r => {
        const name = r.clientName || r.title || '';
        const surname = r.clientSurname || '';
        const fullName = `${name} ${surname}`.toLowerCase();
        const phone = r.clientPhone || '';
        const service = r.service || '';
        return fullName.includes(q) || phone.includes(q) || service.toLowerCase().includes(q);
      });
    }
    if (priceS === 'asc') filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (priceS === 'desc') filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    setFilteredRecords(filtered);
  };

  useEffect(() => { applyFilters(records, search, filterType, dateFilter, priceSort); }, [search, filterType, dateFilter, priceSort]);

  const deleteRecord = (id) => {
    Alert.alert('Удалить запись?', '', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        await deleteAppointmentLocal(id);
        loadRecords();
      }}
    ]);
  };

  const sendSMS = (phone) => {
    if (!phone) return;
    SMS.isAvailableAsync().then(isAv => {
      if (isAv) SMS.sendSMSAsync([phone], '');
      else Alert.alert('Ошибка', 'SMS недоступны');
    });
  };

  const callClient = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Ошибка', 'Не удалось позвонить'));
  };

  const getRecordIcon = (r) => { const t = r.type || 'client'; if (t === 'client') return '👤'; if (t === 'personal') return '📝'; return '☕'; };
  const getRecordTitle = (r) => {
    const t = r.type || 'client';
    if (t === 'client') return r.clientSurname ? `${r.clientName || ''} ${r.clientSurname}` : (r.clientName || 'Без имени');
    if (t === 'personal') return r.title || 'Личная запись';
    return 'Перерыв';
  };
  const getRecordSubtitle = (r) => {
    const t = r.type || 'client';
    if (t === 'client') return `${r.service || ''} • ${r.clientPhone || ''}`;
    if (t === 'personal') return r.description || '';
    return r.description || `Длительность: ${r.duration || 30} мин`;
  };
  const getRecordDate = (r) => `${formatShortDate(r.date)} в ${r.time}`;

  const SwipeableRow = ({ item }) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const panResponder = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 10,
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dx < 0) {
            translateX.setValue(Math.max(gestureState.dx, -120));
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -60) {
            Animated.spring(translateX, { toValue: -120, useNativeDriver: true }).start();
          } else {
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          }
        },
      })
    ).current;

    const isClient = item.type === 'client' || !item.type;
    const bgColor = getClientColor(item.clientPhone);

    const handlePress = () => {
      if (isClient && item.clientPhone) {
        navigation.navigate('ClientCard', {
          client: {
            name: item.clientName,
            surname: item.clientSurname,
            phone: item.clientPhoneNormalized || normalizePhone(item.clientPhone || ''),
          }
        });
      } else {
        navigation.navigate('EditAppointment', { appointment: item, onUpdate: loadRecords });
      }
    };

    return (
      <View style={styles.swipeContainer}>
        <View style={styles.deleteActions}>
          <TouchableOpacity style={styles.deleteSwipeBtn} onPress={() => deleteRecord(item.id)}>
            <Text style={styles.deleteSwipeText}>🗑️</Text>
          </TouchableOpacity>
        </View>
        <Animated.View style={{ flex: 1, transform: [{ translateX }] }} {...panResponder.panHandlers}>
          <TouchableOpacity 
            style={[styles.recordCard, { backgroundColor: bgColor, borderLeftColor: isClient ? '#9B59B6' : '#F39C12' }]}
            onPress={handlePress}
            activeOpacity={0.7}
          >
            <View style={styles.recordCardHeader}>
              <View style={styles.recordIconContainer}>
                <Text style={styles.recordIcon}>{getRecordIcon(item)}</Text>
              </View>
              <View style={styles.recordInfo}>
                <Text style={styles.recordTitle}>{getRecordTitle(item)}</Text>
                {getRecordSubtitle(item) ? <Text style={styles.recordSubtitle} numberOfLines={1}>{getRecordSubtitle(item)}</Text> : null}
                <Text style={styles.recordDate}>{getRecordDate(item)}</Text>
              </View>
            </View>
            <View style={styles.recordActions}>
              {isClient && item.clientPhone && (
                <>
                  <TouchableOpacity style={styles.actionCallBtn} onPress={() => callClient(item.clientPhone)}>
                    <Text style={styles.actionCallIcon}>📞</Text>
                    <Text style={styles.actionCallText}>Звонок</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionSmsBtn} onPress={() => sendSMS(item.clientPhone)}>
                    <Text style={styles.actionSmsIcon}>💬</Text>
                    <Text style={styles.actionSmsText}>SMS</Text>
                  </TouchableOpacity>
                </>
              )}
              {item.price > 0 && <Text style={styles.recordPrice}>{item.price} ₽</Text>}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const FilterChip = ({ title, value, current, emoji }) => (
    <TouchableOpacity style={[styles.filterChip, current === value && styles.filterChipActive]} onPress={() => setFilterType(value)}>
      <Text style={[styles.filterChipText, current === value && styles.filterChipTextActive]}>{emoji} {title}</Text>
    </TouchableOpacity>
  );

  const DateChip = ({ title, value }) => (
    <TouchableOpacity style={[styles.dateChip, dateFilter === value && styles.dateChipActive]} onPress={() => setDateFilter(value)}>
      <Text style={[styles.dateChipText, dateFilter === value && styles.dateChipTextActive]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={styles.backBtnText}>←</Text></TouchableOpacity>
        <Text style={styles.topBarTitle}>Все записи</Text>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)}><Text style={styles.filterToggleBtn}>{showFilters ? '✕' : '⚙️'}</Text></TouchableOpacity>
      </View>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput style={styles.searchInput} placeholder="Поиск по имени, телефону или услуге" value={search} onChangeText={setSearch} placeholderTextColor="#555555" />
        {search !== '' && <TouchableOpacity onPress={() => setSearch('')}><Text style={styles.clearBtn}>✕</Text></TouchableOpacity>}
      </View>
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterChip title="Все" value="all" current={filterType} emoji="📋" />
          <FilterChip title="Клиенты" value="clients" current={filterType} emoji="👤" />
          <FilterChip title="Личные" value="personal" current={filterType} emoji="📝" />
          <FilterChip title="Перерывы" value="breaks" current={filterType} emoji="☕" />
        </ScrollView>
      </View>
      {showFilters && (
        <View style={styles.advancedFilters}>
          <Text style={styles.filterSectionTitle}>Период</Text>
          <View style={styles.dateFilterRow}>
            <DateChip title="Всё время" value="all" />
            <DateChip title="Сегодня" value="today" />
            <DateChip title="Неделя" value="week" />
            <DateChip title="Месяц" value="month" />
          </View>
          <Text style={styles.filterSectionTitle}>Сортировка по цене</Text>
          <View style={styles.dateFilterRow}>
            <TouchableOpacity style={[styles.sortBtn, priceSort === 'asc' && styles.sortBtnActive]} onPress={() => setPriceSort(priceSort === 'asc' ? 'none' : 'asc')}>
              <Text style={[styles.sortBtnText, priceSort === 'asc' && styles.sortBtnTextActive]}>↑ Дешевле</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sortBtn, priceSort === 'desc' && styles.sortBtnActive]} onPress={() => setPriceSort(priceSort === 'desc' ? 'none' : 'desc')}>
              <Text style={[styles.sortBtnText, priceSort === 'desc' && styles.sortBtnTextActive]}>↓ Дороже</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>Найдено: {filteredRecords.length}</Text>
        <Text style={styles.statsText}>Сумма: {filteredRecords.reduce((s, r) => s + (r.price || 0), 0)} ₽</Text>
      </View>
      {loading ? <ActivityIndicator size="large" color="#9B59B6" style={styles.loader} /> : (
        <FlatList data={filteredRecords} renderItem={({ item }) => <SwipeableRow item={item} />} keyExtractor={item => item.id} ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>{search ? 'Ничего не найдено' : 'Нет записей'}</Text></View>} showsVerticalScrollIndicator={false} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1C1E' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#2C2C2E', borderBottomWidth: 1, borderBottomColor: '#3A3A3C' },
  backBtn: { padding: 5 },
  backBtnText: { fontSize: 24, color: '#9B59B6', fontWeight: '600' },
  topBarTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  filterToggleBtn: { fontSize: 22, color: '#9B59B6', padding: 5 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', marginHorizontal: 15, marginTop: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#3A3A3C' },
  searchIcon: { fontSize: 16, marginRight: 8, color: '#8E8E93' },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#FFFFFF' },
  clearBtn: { fontSize: 18, color: '#8E8E93', padding: 5 },
  filterRow: { paddingHorizontal: 15, marginTop: 10 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#2C2C2E', marginRight: 8, borderWidth: 1, borderColor: '#3A3A3C' },
  filterChipActive: { backgroundColor: '#9B59B6', borderColor: '#9B59B6' },
  filterChipText: { fontSize: 13, color: '#AAAAAA' },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  advancedFilters: { marginHorizontal: 15, marginTop: 10, padding: 15, backgroundColor: '#2C2C2E', borderRadius: 12 },
  filterSectionTitle: { fontSize: 12, fontWeight: '600', color: '#9B59B6', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateFilterRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  dateChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 15, backgroundColor: '#1C1C1E', marginRight: 8, marginBottom: 5 },
  dateChipActive: { backgroundColor: '#9B59B625' },
  dateChipText: { fontSize: 13, color: '#AAAAAA' },
  dateChipTextActive: { color: '#9B59B6', fontWeight: '600' },
  sortBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 15, backgroundColor: '#1C1C1E', marginRight: 8 },
  sortBtnActive: { backgroundColor: '#9B59B625' },
  sortBtnText: { fontSize: 13, color: '#AAAAAA' },
  sortBtnTextActive: { color: '#9B59B6', fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  statsText: { fontSize: 13, color: '#8E8E93' },
  loader: { marginTop: 50 },
  swipeContainer: { flexDirection: 'row', alignItems: 'stretch', marginHorizontal: 15, marginBottom: 8 },
  deleteActions: { width: 60, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E74C3C', borderRadius: 12, marginRight: 5 },
  deleteSwipeBtn: { padding: 10 },
  deleteSwipeText: { fontSize: 24 },
  recordCard: { flex: 1, borderRadius: 12, borderLeftWidth: 3, padding: 14 },
  recordCardHeader: { flexDirection: 'row', alignItems: 'center' },
  recordIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recordIcon: { fontSize: 18 },
  recordInfo: { flex: 1 },
  recordTitle: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  recordSubtitle: { fontSize: 12, color: '#CCCCCC', marginTop: 2 },
  recordDate: { fontSize: 11, color: '#AAAAAA', marginTop: 3 },
  recordActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#FFFFFF15' },
  actionCallBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#27AE60', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionCallIcon: { fontSize: 14, marginRight: 4 },
  actionCallText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  actionSmsBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3498DB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionSmsIcon: { fontSize: 14, marginRight: 4 },
  actionSmsText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  recordPrice: { fontSize: 15, fontWeight: '700', color: '#27AE60' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#8E8E93', fontSize: 15 },
});