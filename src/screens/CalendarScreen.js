import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { toLocalDateString, datesEqual } from '../config/constants';
import { sortAppointmentsByDateTime } from '../config/sort';
import { deleteAppointmentLocal, isClientAppointment } from '../config/storage';
import { registerForPushNotificationsAsync, cancelAppointmentReminder } from '../config/notifications';
import { useAppointments } from '../hooks/useAppointments';
import { useReminderMessage } from '../hooks/useReminderMessage';
import { useShowReminders } from '../hooks/useShowReminders';
import { WeekCalendar } from '../components/WeekCalendar';
import { DayReminders } from '../components/DayReminders';
import { AppointmentCard } from '../components/appointments/AppointmentCard';
import { BottomNav } from '../components/navigation/BottomNav';
import { MonthCalendarModal } from '../components/calendar/MonthCalendarModal';
import { NewAppointmentModal } from '../components/appointments/NewAppointmentModal';
import { AppointmentContextMenu } from '../components/appointments/AppointmentContextMenu';
import { CalendarHomeHeader } from '../components/calendar/CalendarHomeHeader';
import { DayStatsBar } from '../components/calendar/DayStatsBar';
import { COLORS } from '../config/colors';
import { commonStyles } from '../theme/commonStyles';

const LIST_EMPTY = <Text style={commonStyles.emptyText}>Нет записей на этот день</Text>;

export const CalendarScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(toLocalDateString());
  const [contextMenuAppointment, setContextMenuAppointment] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  const { appointments: allAppointments, loading, syncStatus, refresh } = useAppointments({
    syncOnFocus: true,
    scheduleReminders: true,
  });

  const { showReminders, toggleReminders } = useShowReminders();
  const { sendDayBeforeReminder } = useReminderMessage(refresh);

  useEffect(() => {
    registerForPushNotificationsAsync().catch(() => {});
  }, []);

  const appointments = useMemo(() => {
    const dayApps = allAppointments.filter((a) => datesEqual(a.date, selectedDate));
    return sortAppointmentsByDateTime(dayApps);
  }, [selectedDate, allAppointments]);

  const dayStats = useMemo(() => {
    let earnings = 0;
    let clientCount = 0;
    let personalCount = 0;
    for (const a of appointments) {
      if (a.type === 'personal') personalCount++;
      if (isClientAppointment(a) && a.status !== 'cancelled') {
        clientCount++;
        earnings += a.price || 0;
      }
    }
    return { earnings, clientCount, personalCount };
  }, [appointments]);

  const handlePressItem = useCallback((item) => {
    navigation.navigate('EditAppointment', { appointment: item, onUpdate: refresh });
  }, [navigation, refresh]);

  const handleLongPressItem = useCallback((item) => {
    setContextMenuAppointment(item);
  }, []);

  const renderItem = useCallback(({ item }) => (
    <AppointmentCard
      item={item}
      onPressItem={handlePressItem}
      onLongPressItem={handleLongPressItem}
    />
  ), [handlePressItem, handleLongPressItem]);

  const handleNewType = useCallback((type) => {
    setActiveModal(null);
    if (type === 'client') {
      navigation.navigate('NewAppointment', { selectedDate, onSave: refresh });
    } else {
      navigation.navigate('NewNote', { type, selectedDate, onSave: refresh });
    }
  }, [navigation, selectedDate, refresh]);

  const handleBottomNav = useCallback((key) => {
    if (key === 'month') setActiveModal('month');
    else if (key === 'stats') navigation.navigate('Stats');
    else if (key === 'records') navigation.navigate('AllRecords');
    else if (key === 'notify') navigation.navigate('NotifyCity');
  }, [navigation]);

  const handleDelete = useCallback(async (app) => {
    if (!app?.id) return;
    try {
      await cancelAppointmentReminder(app.id);
      await deleteAppointmentLocal(app.id);
      refresh();
    } catch {
      Alert.alert('Ошибка', 'Не удалось удалить запись');
    }
  }, [refresh]);

  return (
    <SafeAreaView style={commonStyles.screen}>
      <CalendarHomeHeader
        dailyEarnings={dayStats.earnings}
        syncStatus={syncStatus}
        showReminders={showReminders}
        onToggleReminders={toggleReminders}
        onOpenTemplates={() => navigation.navigate('Templates')}
      />

      <WeekCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} appointments={allAppointments} />

      <DayStatsBar
        earnings={dayStats.earnings}
        clientCount={dayStats.clientCount}
        personalCount={dayStats.personalCount}
      />

      {showReminders && <DayReminders appointments={allAppointments} onSendReminder={sendDayBeforeReminder} />}

      <View style={styles.listWrap}>
        <FlatList
          data={appointments}
          renderItem={renderItem}
          keyExtractor={(item) => item.id ?? `${item.date}-${item.time}-${item.clientPhone}`}
          extraData={selectedDate}
          ListEmptyComponent={LIST_EMPTY}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
        />
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => setActiveModal('new')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <BottomNav onPress={handleBottomNav} />

      <NewAppointmentModal
        visible={activeModal === 'new'}
        onClose={() => setActiveModal(null)}
        onSelect={handleNewType}
      />

      <MonthCalendarModal
        visible={activeModal === 'month'}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onClose={() => setActiveModal(null)}
      />

      <AppointmentContextMenu
        visible={Boolean(contextMenuAppointment)}
        appointment={contextMenuAppointment}
        onClose={() => setContextMenuAppointment(null)}
        onEdit={() => {
          const app = contextMenuAppointment;
          setContextMenuAppointment(null);
          navigation.navigate('EditAppointment', { appointment: app, onUpdate: refresh });
        }}
        onRemind={sendDayBeforeReminder}
        onDelete={handleDelete}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  listWrap: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(244, 246, 249, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute', bottom: 100, right: 20, backgroundColor: COLORS.fab,
    width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  fabText: { fontSize: 28, color: COLORS.textOnPrimary, fontWeight: '300' },
});
