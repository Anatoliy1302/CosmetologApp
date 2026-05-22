import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../config/colors';
import { WEEKDAYS, MONTH_NAMES } from '../config/constants';

export const WeekCalendar = ({ selectedDate, onSelectDate, appointments }) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date(selectedDate);
    const day = today.getDay();
    // В России неделя начинается с понедельника (day 1 = Пн, day 0 = Вс)
    const diff = today.getDate() - (day === 0 ? 6 : day - 1);
    const monday = new Date(today);
    monday.setDate(diff);
    return monday;
  });

  const getWeekDays = () => {
    const days = [];
    const startDate = new Date(currentWeekStart);
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      const dayAppointments = (appointments || []).filter(a => a.date === dateString);
      days.push({
        date: dateString,
        dayName: WEEKDAYS[i],
        dayNumber: date.getDate(),
        isToday: dateString === new Date().toISOString().split('T')[0],
        isSelected: dateString === selectedDate,
        appointmentsCount: dayAppointments.length,
        earnings: dayAppointments.reduce((sum, a) => sum + (a.price || 0), 0)
      });
    }
    return days;
  };

  const weekDays = getWeekDays();
  const currentMonth = MONTH_NAMES[currentWeekStart.getMonth()];
  const currentYear = currentWeekStart.getFullYear();

  return (
    <View style={styles.weekCalendarContainer}>
      <View style={styles.weekCalendarHeader}>
        <TouchableOpacity onPress={() => { const ns = new Date(currentWeekStart); ns.setDate(currentWeekStart.getDate() - 7); setCurrentWeekStart(ns); }} style={styles.weekNavButton}><Text style={styles.weekNavText}>←</Text></TouchableOpacity>
        <View style={styles.weekTitleContainer}>
          <Text style={styles.weekTitle}>{currentMonth} {currentYear}</Text>
          <TouchableOpacity onPress={() => { const today = new Date(); const day = today.getDay(); const diff = today.getDate() - (day === 0 ? 6 : day - 1); const monday = new Date(today); monday.setDate(diff); setCurrentWeekStart(monday); onSelectDate(new Date().toISOString().split('T')[0]); }}><Text style={styles.todayButton}>Сегодня</Text></TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => { const ns = new Date(currentWeekStart); ns.setDate(currentWeekStart.getDate() + 7); setCurrentWeekStart(ns); }} style={styles.weekNavButton}><Text style={styles.weekNavText}>→</Text></TouchableOpacity>
      </View>
      <View style={styles.weekDaysContainer}>
        {weekDays.map((day, index) => (
          <TouchableOpacity key={index} style={[styles.weekDay, day.isSelected && styles.weekDaySelected, day.isToday && styles.weekDayToday]} onPress={() => onSelectDate(day.date)}>
            <Text style={[styles.weekDayName, day.isSelected && styles.weekDayTextSelected]}>{day.dayName}</Text>
            <Text style={[styles.weekDayNumber, day.isSelected && styles.weekDayTextSelected]}>{day.dayNumber}</Text>
            {day.appointmentsCount > 0 && <View style={[styles.weekDayBadge, day.isSelected && styles.weekDayBadgeSelected]}><Text style={styles.weekDayBadgeText}>{day.appointmentsCount}</Text></View>}
            {day.earnings > 0 && <Text style={[styles.weekDayEarnings, day.isSelected && styles.weekDayTextSelected]}>{day.earnings}₽</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  weekCalendarContainer: { backgroundColor: COLORS.calendarBg, paddingVertical: 15, marginHorizontal: 15, marginBottom: 10, borderRadius: 20 },
  weekCalendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, marginBottom: 15 },
  weekNavButton: { padding: 10 },
  weekNavText: { fontSize: 22, color: '#FFFFFF', fontWeight: 'bold' },
  weekTitleContainer: { alignItems: 'center' },
  weekTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  todayButton: { fontSize: 13, color: '#FFFFFF', marginTop: 3, fontWeight: '500' },
  weekDaysContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 5 },
  weekDay: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 5, borderRadius: 15, minWidth: 45 },
  weekDaySelected: { backgroundColor: COLORS.primary },
  weekDayToday: { borderWidth: 2, borderColor: COLORS.primary },
  weekDayName: { fontSize: 13, color: '#FFFFFF', marginBottom: 4 },
  weekDayNumber: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  weekDayTextSelected: { color: '#fff' },
  weekDayBadge: { backgroundColor: COLORS.primaryLight, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 2 },
  weekDayBadgeSelected: { backgroundColor: '#fff' },
  weekDayBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  weekDayEarnings: { fontSize: 10, color: COLORS.success, fontWeight: '500' },
});