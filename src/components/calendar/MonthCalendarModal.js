import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { COLORS, DARK_CALENDAR_THEME } from '../../config/colors';

export const MonthCalendarModal = ({ visible, selectedDate, onSelectDate, onClose }) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.overlay}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Выберите дату</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.close}>✕</Text></TouchableOpacity>
        </View>
        <Calendar
          current={selectedDate}
          onDayPress={(day) => { onSelectDate(day.dateString); onClose(); }}
          markedDates={{ [selectedDate]: { selected: true, selectedColor: COLORS.primary } }}
          firstDay={1}
          theme={DARK_CALENDAR_THEME}
        />
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Закрыть</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', alignItems: 'center' },
  content: { backgroundColor: COLORS.calendarDarkBg, borderRadius: 20, padding: 20, width: '92%', borderWidth: 1, borderColor: '#3A3A3C' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#3A3A3C' },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.calendarDarkText },
  close: { fontSize: 22, color: COLORS.calendarDarkTextMuted },
  closeBtn: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  closeBtnText: { color: COLORS.textOnPrimary, fontSize: 16, fontWeight: '600' },
});
