import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadFromStorage, deleteAppointmentLocal } from '../config/storage';
import { sortAppointmentsByDateTime } from '../config/sort';
import { callPhone, sendSms } from '../config/messaging';
import { filterRecords } from '../utils/filters';
import { RecordSwipeRow } from '../components/RecordSwipeRow';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { COLORS } from '../config/colors';
import { commonStyles } from '../theme/commonStyles';

export const AllRecordsScreen = ({ navigation }) => {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [priceSort, setPriceSort] = useState('none');
  const [showFilters, setShowFilters] = useState(false);

  const loadRecords = useCallback(async () => {
    const data = await loadFromStorage();
    return sortAppointmentsByDateTime(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      loadRecords().then((sorted) => {
        if (active) {
          setRecords(sorted);
          setLoading(false);
        }
      }).catch(() => {
        if (active) {
          setRecords([]);
          setLoading(false);
        }
      });
      return () => { active = false; };
    }, [loadRecords])
  );

  const filteredRecords = useMemo(
    () => filterRecords(records, {
      searchText: search,
      type: filterType,
      dateF: dateFilter,
      priceS: priceSort,
    }),
    [records, search, filterType, dateFilter, priceSort]
  );

  const refreshRecords = useCallback(async () => {
    const sorted = await loadRecords();
    setRecords(sorted);
  }, [loadRecords]);

  const deleteRecord = useCallback((id) => {
    Alert.alert('Удалить запись?', '', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          await deleteAppointmentLocal(id);
          refreshRecords();
        },
      },
    ]);
  }, [refreshRecords]);

  const renderItem = useCallback(({ item }) => (
    <RecordSwipeRow
      item={item}
      navigation={navigation}
      onDelete={deleteRecord}
      onRefresh={refreshRecords}
      onCall={callPhone}
      onSms={(phone) => sendSms(phone)}
    />
  ), [navigation, deleteRecord, refreshRecords]);

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
    <SafeAreaView style={commonStyles.screen}>
      <ScreenHeader
        title="Все записи"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
            <Text style={{ fontSize: 22, color: COLORS.textOnPrimary }}>{showFilters ? '✕' : '⚙️'}</Text>
          </TouchableOpacity>
        }
      />
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput style={styles.searchInput} placeholder="Поиск по имени, телефону или услуге" value={search} onChangeText={setSearch} placeholderTextColor={COLORS.textLight} />
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
      {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={commonStyles.loader} /> : (
        <FlatList
          data={filteredRecords}
          renderItem={renderItem}
          keyExtractor={(item) => item.id ?? `${item.date}-${item.time}-${item.clientPhone}`}
          ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>{search ? 'Ничего не найдено' : 'Нет записей'}</Text></View>}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, marginHorizontal: 15, marginTop: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  searchIcon: { fontSize: 16, marginRight: 8, color: COLORS.textLight },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: COLORS.textPrimary },
  clearBtn: { fontSize: 18, color: COLORS.textLight, padding: 5 },
  filterRow: { paddingHorizontal: 15, marginTop: 10 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.cardBg, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, color: COLORS.textSecondary },
  filterChipTextActive: { color: COLORS.textOnPrimary, fontWeight: '600' },
  advancedFilters: { marginHorizontal: 15, marginTop: 10, padding: 15, backgroundColor: COLORS.cardBg, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  filterSectionTitle: { fontSize: 12, fontWeight: '600', color: COLORS.primary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateFilterRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  dateChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 15, backgroundColor: COLORS.surfaceAlt, marginRight: 8, marginBottom: 5 },
  dateChipActive: { backgroundColor: COLORS.secondary },
  dateChipText: { fontSize: 13, color: COLORS.textSecondary },
  dateChipTextActive: { color: COLORS.primary, fontWeight: '600' },
  sortBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 15, backgroundColor: COLORS.surfaceAlt, marginRight: 8 },
  sortBtnActive: { backgroundColor: COLORS.secondary },
  sortBtnText: { fontSize: 13, color: COLORS.textSecondary },
  sortBtnTextActive: { color: COLORS.primary, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  statsText: { fontSize: 13, color: COLORS.textSecondary },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: COLORS.textLight, fontSize: 15 },
});
