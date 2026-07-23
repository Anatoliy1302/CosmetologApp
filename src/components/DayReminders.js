import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { isClientAppointment } from '../config/storage';
import { COLORS } from '../config/colors';
import { getTomorrowDateString, datesEqual } from '../config/constants';
import { sortAppointmentsByDateTime } from '../config/sort';

export const DayReminders = ({ appointments, onSendReminder }) => {
  const tomorrowString = getTomorrowDateString();

  const tomorrowAppointments = sortAppointmentsByDateTime(
    (appointments || []).filter(app =>
      datesEqual(app.date, tomorrowString) &&
      isClientAppointment(app) &&
      app.status !== 'cancelled' &&
      !app.reminderSent
    )
  );

  if (tomorrowAppointments.length === 0) return null;

  return (
    <View style={styles.remindersContainer}>
      <View style={styles.remindersHeader}>
        <Text style={styles.remindersTitle}>🔔 Напоминания на завтра</Text>
        <Text style={styles.remindersCount}>{tomorrowAppointments.length} записей</Text>
      </View>
      {tomorrowAppointments.map((app) => (
        <View key={app.id} style={styles.reminderCard}>
          <View style={styles.reminderInfo}>
            <Text style={styles.reminderTime}>{app.time}</Text>
            <View style={styles.reminderDetails}>
              <Text style={styles.reminderClient}>{app.clientName}</Text>
              <Text style={styles.reminderService}>{app.service}</Text>
            </View>
          </View>
          <View style={styles.reminderActions}>
            <TouchableOpacity style={styles.sendReminderButton} onPress={() => onSendReminder(app)}>
              <Text style={styles.sendReminderText}>📱 Напомнить</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  remindersContainer: { backgroundColor: COLORS.cardBg, marginHorizontal: 15, marginBottom: 10, borderRadius: 15, padding: 15, borderWidth: 1, borderColor: COLORS.border },
  remindersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  remindersTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  remindersCount: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },
  reminderCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  reminderInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  reminderTime: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary, width: 50 },
  reminderDetails: { flex: 1, marginLeft: 10 },
  reminderClient: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  reminderService: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  reminderActions: { marginLeft: 10 },
  sendReminderButton: { backgroundColor: COLORS.primary, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  sendReminderText: { color: COLORS.textOnPrimary, fontSize: 13, fontWeight: '500' },
});
