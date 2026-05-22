import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator, Modal, Linking, Image, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config/colors';
import { WEEKDAYS, MONTH_NAMES, formatDate, formatTemplate, REMINDER_TEMPLATES, normalizePhone, getAddressByCity } from '../config/constants';
import { loadFromStorage, updateAppointmentLocal, deleteAppointmentLocal } from '../config/storage';
import { WeekCalendar } from '../components/WeekCalendar';
import { DayReminders } from '../components/DayReminders';
import { registerForPushNotificationsAsync, scheduleAllReminders, scheduleAppointmentReminder, cancelAppointmentReminder } from '../config/notifications';

export const CalendarScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [monthCalendarVisible, setMonthCalendarVisible] = useState(false);
  const [showReminders, setShowReminders] = useState(true);
  const [newAppointmentModalVisible, setNewAppointmentModalVisible] = useState(false);

  const loadAll = async () => {
    const data = await loadFromStorage();
    setAllAppointments(data);
    setLoading(false);
    scheduleAllReminders(data);
  };

  useEffect(() => { loadAll(); const i = setInterval(loadAll, 3000); return () => clearInterval(i); }, []);
  useEffect(() => { registerForPushNotificationsAsync(); }, []);
  useEffect(() => {
    const dayApps = allAppointments.filter(a => a.date === selectedDate);
    dayApps.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    setAppointments(dayApps);
  }, [selectedDate, allAppointments]);
  useEffect(() => { AsyncStorage.getItem('showReminders').then(v => { if (v !== null) setShowReminders(v === 'true'); }); }, []);

  const toggleReminders = async () => {
    const newValue = !showReminders;
    setShowReminders(newValue);
    await AsyncStorage.setItem('showReminders', String(newValue));
  };

  const dailyEarnings = appointments.reduce((sum, item) => (item.type === 'client' || !item.type) ? sum + (item.price || 0) : sum, 0);
  const clientAppointments = appointments.filter(app => app.type === 'client' || !app.type);
  const personalAppointments = appointments.filter(app => app.type === 'personal');

  const sendReminder = async (appointment) => {
    if (!appointment || appointment.type !== 'client') return;
    const address = getAddressByCity(appointment.clientCity);
    const message = formatTemplate(REMINDER_TEMPLATES.day_before, { 
      clientName: appointment.clientName, 
      service: appointment.service || 'услуга', 
      date: formatDate(appointment.date), 
      time: appointment.time, 
      price: appointment.price,
      address: address
    });
    Alert.alert('📱 Отправить напоминание', 'Выберите способ', [
      { text: 'Отмена', style: 'cancel' },
      { text: '📱 SMS', onPress: async () => { const isAv = await SMS.isAvailableAsync(); if (isAv) { await SMS.sendSMSAsync([appointment.clientPhone], message); await updateAppointmentLocal(appointment.id, { reminderSent: true }); loadAll(); } } },
      { text: '💬 WhatsApp', onPress: async () => { const url = `whatsapp://send?phone=${normalizePhone(appointment.clientPhone)}&text=${encodeURIComponent(message)}`; const s = await Linking.canOpenURL(url); if (s) { await Linking.openURL(url); await updateAppointmentLocal(appointment.id, { reminderSent: true }); loadAll(); } } }
    ]);
  };

  const callClient = (phone) => { if (!phone) return; Linking.openURL(`tel:${phone}`).catch(() => {}); };

  const todayString = new Date().toISOString().split('T')[0];
  const todayApps = allAppointments.filter(a => a.date === todayString && (a.type === 'client' || !a.type));
  const upcomingApps = todayApps.filter(a => a.time > new Date().toTimeString().slice(0, 5));
  const pastApps = todayApps.filter(a => a.time <= new Date().toTimeString().slice(0, 5));

  const renderAppointmentCard = ({ item }) => {
    const isClient = item.type === 'client' || !item.type;
    const isPersonal = item.type === 'personal';
    const isBreak = item.type === 'break';
    const cardBgColor = isClient ? '#3D2025' : (isPersonal ? '#1F3D2E' : '#3D3520');
    const borderColor = isClient ? '#E74C3C' : (isPersonal ? '#27AE60' : '#F39C12');
    const timeColor = isClient ? '#E74C3C' : (isPersonal ? '#27AE60' : '#F39C12');

    return (
      <TouchableOpacity style={[styles.card, { backgroundColor: cardBgColor, borderLeftWidth: 3, borderLeftColor: borderColor }]} onPress={() => navigation.navigate('EditAppointment', { appointment: item, onUpdate: loadAll })} onLongPress={() => { setSelectedAppointment(item); setContextMenuVisible(true); }}>
        <View style={styles.cardContent}>
          <View style={[styles.timeContainer, { backgroundColor: timeColor + '25' }]}>
            <Text style={[styles.time, { color: timeColor }]}>{item.time}</Text>
          </View>
          <View style={styles.infoContainer}>
            {isClient ? (
              <>
                <Text style={styles.cardClient}>{item.clientSurname ? `${item.clientName} ${item.clientSurname}` : item.clientName}</Text>
                {item.clientPhone ? <Text style={styles.cardPhone}>{item.clientPhone}</Text> : null}
                <Text style={styles.cardService}>{item.service}</Text>
                {item.price > 0 && <Text style={styles.cardPrice}>{item.price} ₽</Text>}
              </>
            ) : isPersonal ? (
              <Text style={styles.cardClient}>📝 {item.title || 'Личная запись'}</Text>
            ) : (
              <Text style={styles.cardClient}>☕ {item.title || 'Перерыв'}</Text>
            )}
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="cover" />
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle}>Косметолог Альбина</Text>
          <Text style={styles.topBarSubtitle}>{dailyEarnings} ₽ сегодня</Text>
        </View>
        <TouchableOpacity onPress={toggleReminders} style={styles.topBarBtn}>
          <Text style={[styles.topBarBtnText, !showReminders && styles.topBarBtnInactive]}>🔔</Text>
        </TouchableOpacity>
      </View>

      <WeekCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} appointments={allAppointments} />

      <View style={styles.statsBar}>
        <View style={styles.statItem}><Text style={styles.statValue}>💰 {dailyEarnings} ₽</Text></View>
        <View style={styles.statItem}><Text style={styles.statValue}>👤 {clientAppointments.length}</Text></View>
        <View style={styles.statItem}><Text style={styles.statValue}>📝 {personalAppointments.length}</Text></View>
      </View>

      <View style={styles.todayWidget}>
        <View style={styles.todayWidgetHeader}>
          <Text style={styles.todayWidgetTitle}>📋 Сегодня</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.todayWidgetScroll}>
          <View style={[styles.todayStatCard, { backgroundColor: '#27AE6020' }]}>
            <Text style={styles.todayStatNumber}>{todayApps.length}</Text>
            <Text style={styles.todayStatLabel}>Всего</Text>
          </View>
          <View style={[styles.todayStatCard, { backgroundColor: '#9B59B620' }]}>
            <Text style={styles.todayStatNumber}>{upcomingApps.length}</Text>
            <Text style={styles.todayStatLabel}>Предстоит</Text>
          </View>
          <View style={[styles.todayStatCard, { backgroundColor: '#8E8E9320' }]}>
            <Text style={styles.todayStatNumber}>{pastApps.length}</Text>
            <Text style={styles.todayStatLabel}>Прошло</Text>
          </View>
          <View style={[styles.todayStatCard, { backgroundColor: '#F39C1220' }]}>
            <Text style={styles.todayStatNumber}>{todayApps.reduce((s, a) => s + (a.price || 0), 0)} ₽</Text>
            <Text style={styles.todayStatLabel}>Выручка</Text>
          </View>
        </ScrollView>
      </View>

      {showReminders && <DayReminders appointments={allAppointments} onSendReminder={sendReminder} />}

      {loading ? <ActivityIndicator size="large" color="#9B59B6" style={styles.loader} /> : (
        <FlatList data={appointments} renderItem={renderAppointmentCard} keyExtractor={item => item.id} ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>Нет записей на этот день</Text></View>} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setNewAppointmentModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setMonthCalendarVisible(true)}>
          <View style={[styles.navIconBox, { backgroundColor: '#9B59B620' }]}><Text style={styles.navIcon3D}>📅</Text></View>
          <Text style={styles.navLabel}>Месяц</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Stats')}>
          <View style={[styles.navIconBox, { backgroundColor: '#3498DB20' }]}><Text style={styles.navIcon3D}>📊</Text></View>
          <Text style={styles.navLabel}>Статистика</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AllRecords')}>
          <View style={[styles.navIconBox, { backgroundColor: '#27AE6020' }]}><Text style={styles.navIcon3D}>📋</Text></View>
          <Text style={styles.navLabel}>Записи</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('NotifyCity', { allAppointments, selectedDate })}>
          <View style={[styles.navIconBox, { backgroundColor: '#F39C1220' }]}><Text style={styles.navIcon3D}>📢</Text></View>
          <Text style={styles.navLabel}>Рассылка</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={newAppointmentModalVisible} transparent animationType="slide">
        <View style={styles.newAppointmentOverlay}>
          <View style={styles.newAppointmentContent}>
            <View style={styles.newAppointmentHeader}>
              <Text style={styles.newAppointmentTitle}>Новая запись</Text>
              <TouchableOpacity onPress={() => setNewAppointmentModalVisible(false)}><Text style={styles.newAppointmentClose}>✕</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.optionBtn} onPress={() => { setNewAppointmentModalVisible(false); navigation.navigate('NewAppointment', { selectedDate, onSave: loadAll }); }}>
              <View style={[styles.optionIcon, { backgroundColor: '#E74C3C' }]}><Text style={styles.optionIconText}>👤</Text></View>
              <View style={styles.optionInfo}><Text style={styles.optionTitle}>Запись клиента</Text><Text style={styles.optionDesc}>Добавить клиента на процедуру</Text></View>
              <Text style={styles.optionArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionBtn} onPress={() => { setNewAppointmentModalVisible(false); navigation.navigate('NewPersonalNote', { selectedDate, onSave: loadAll }); }}>
              <View style={[styles.optionIcon, { backgroundColor: '#27AE60' }]}><Text style={styles.optionIconText}>📝</Text></View>
              <View style={styles.optionInfo}><Text style={styles.optionTitle}>Личная запись</Text><Text style={styles.optionDesc}>Заметки, планы, напоминания</Text></View>
              <Text style={styles.optionArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionBtn} onPress={() => { setNewAppointmentModalVisible(false); navigation.navigate('NewBreak', { selectedDate, onSave: loadAll }); }}>
              <View style={[styles.optionIcon, { backgroundColor: '#F39C12' }]}><Text style={styles.optionIconText}>☕</Text></View>
              <View style={styles.optionInfo}><Text style={styles.optionTitle}>Перерыв</Text><Text style={styles.optionDesc}>Обед, отдых, пауза</Text></View>
              <Text style={styles.optionArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelOptionBtn} onPress={() => setNewAppointmentModalVisible(false)}>
              <Text style={styles.cancelOptionText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={monthCalendarVisible} transparent animationType="slide">
        <View style={styles.monthModalOverlay}>
          <View style={styles.monthModalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Выберите дату</Text><TouchableOpacity onPress={() => setMonthCalendarVisible(false)}><Text style={styles.closeButton}>✕</Text></TouchableOpacity></View>
            <Calendar
              current={selectedDate}
              onDayPress={(day) => { setSelectedDate(day.dateString); setMonthCalendarVisible(false); }}
              markedDates={{ [selectedDate]: { selected: true, selectedColor: '#9B59B6' } }}
              firstDay={1}
              theme={{
                backgroundColor: '#1C1C1E',
                calendarBackground: '#1C1C1E',
                selectedDayBackgroundColor: '#9B59B6',
                todayTextColor: '#9B59B6',
                arrowColor: '#9B59B6',
                monthTextColor: '#FFFFFF',
                textMonthFontWeight: 'bold',
                textDayFontSize: 15,
                textMonthFontSize: 16,
                dayTextColor: '#FFFFFF',
                textDisabledColor: '#555555',
                textSectionTitleColor: '#9B59B6',
              }}
            />
            <TouchableOpacity style={styles.closeMonthButton} onPress={() => setMonthCalendarVisible(false)}><Text style={styles.closeMonthButtonText}>Закрыть</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={contextMenuVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.contextMenuOverlay} activeOpacity={1} onPress={() => setContextMenuVisible(false)}>
          <View style={styles.contextMenu}>
            <TouchableOpacity style={styles.contextMenuItem} onPress={() => { setContextMenuVisible(false); navigation.navigate('EditAppointment', { appointment: selectedAppointment, onUpdate: loadAll }); }}><Text style={styles.contextMenuText}>✏️ Редактировать</Text></TouchableOpacity>
            {selectedAppointment?.clientPhone && <TouchableOpacity style={styles.contextMenuItem} onPress={() => { setContextMenuVisible(false); Linking.openURL(`tel:${selectedAppointment.clientPhone}`); }}><Text style={styles.contextMenuText}>📞 Позвонить</Text></TouchableOpacity>}
            {(selectedAppointment?.type === 'client' || !selectedAppointment?.type) && <TouchableOpacity style={styles.contextMenuItem} onPress={() => { setContextMenuVisible(false); sendReminder(selectedAppointment); }}><Text style={styles.contextMenuText}>📱 Напомнить</Text></TouchableOpacity>}
            <TouchableOpacity style={styles.contextMenuItem} onPress={() => {
              Alert.alert('Удалить?', '', [{ text: 'Нет' }, { text: 'Да', style: 'destructive', onPress: async () => { await cancelAppointmentReminder(selectedAppointment?.id); await deleteAppointmentLocal(selectedAppointment?.id); loadAll(); setContextMenuVisible(false); }}]);
            }}><Text style={[styles.contextMenuText, styles.contextMenuDelete]}>🗑️ Удалить</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1C1E' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#2C2C2E', borderBottomWidth: 1, borderBottomColor: '#3A3A3C' },
  logoImage: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: '#9B59B6' },
  topBarCenter: { flex: 1, marginLeft: 12 },
  topBarTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  topBarSubtitle: { fontSize: 12, color: '#9B59B6', marginTop: 2 },
  topBarBtn: { padding: 8 },
  topBarBtnText: { fontSize: 22 },
  topBarBtnInactive: { opacity: 0.4 },
  statsBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, backgroundColor: '#2C2C2E', marginHorizontal: 10, marginTop: 8, borderRadius: 12 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
  todayWidget: { backgroundColor: '#2C2C2E', marginHorizontal: 15, marginBottom: 10, borderRadius: 16, padding: 15 },
  todayWidgetHeader: { marginBottom: 12 },
  todayWidgetTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  todayWidgetScroll: { flexDirection: 'row' },
  todayStatCard: { padding: 14, borderRadius: 14, marginRight: 10, minWidth: 80, alignItems: 'center' },
  todayStatNumber: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  todayStatLabel: { fontSize: 11, color: '#AAAAAA', marginTop: 4 },
  loader: { marginTop: 60 },
  card: { marginHorizontal: 15, marginBottom: 8, borderRadius: 12 },
  cardContent: { flexDirection: 'row', padding: 14, alignItems: 'center' },
  timeContainer: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 15, marginRight: 12 },
  time: { fontWeight: '700', fontSize: 13 },
  infoContainer: { flex: 1 },
  cardClient: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  cardPhone: { fontSize: 12, color: '#AAAAAA', marginTop: 1 },
  cardService: { fontSize: 13, color: '#AAAAAA', marginTop: 3 },
  cardPrice: { fontSize: 14, fontWeight: '700', color: '#27AE60', marginTop: 4 },
  chevron: { fontSize: 18, color: '#555555' },
  fab: { position: 'absolute', bottom: 100, right: 20, backgroundColor: '#9B59B6', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#9B59B6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, zIndex: 10 },
  fabText: { fontSize: 28, color: '#FFFFFF', fontWeight: '300' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingBottom: 28, backgroundColor: '#2C2C2E', borderTopWidth: 1, borderTopColor: '#3A3A3C' },
  navItem: { alignItems: 'center', padding: 5, minWidth: 70 },
  navIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 4, shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 },
  navIcon3D: { fontSize: 26, textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 4 },
  navLabel: { fontSize: 10, color: '#9B59B6', fontWeight: '700', marginTop: 2 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { textAlign: 'center', color: '#8E8E93', fontSize: 15 },
  newAppointmentOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  newAppointmentContent: { backgroundColor: '#2C2C2E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  newAppointmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  newAppointmentTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  newAppointmentClose: { fontSize: 24, color: '#8E8E93', padding: 5 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#3A3A3C' },
  optionIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  optionIconText: { fontSize: 24 },
  optionInfo: { flex: 1 },
  optionTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginBottom: 3 },
  optionDesc: { fontSize: 13, color: '#8E8E93' },
  optionArrow: { fontSize: 24, color: '#555555' },
  cancelOptionBtn: { backgroundColor: '#3A3A3C', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 5 },
  cancelOptionText: { fontSize: 17, fontWeight: '600', color: '#E74C3C' },
  monthModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  monthModalContent: { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 20, width: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#3A3A3C' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  closeButton: { fontSize: 22, color: '#8E8E93' },
  closeMonthButton: { backgroundColor: '#9B59B6', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  closeMonthButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  contextMenuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  contextMenu: { backgroundColor: '#2C2C2E', borderRadius: 15, padding: 10, width: 260 },
  contextMenuItem: { paddingVertical: 14, paddingHorizontal: 20 },
  contextMenuText: { fontSize: 16, color: '#FFFFFF' },
  contextMenuDelete: { color: '#E74C3C' },
});