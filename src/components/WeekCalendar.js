import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../config/colors';
import { WEEKDAYS, MONTH_NAMES, toLocalDateString, parseLocalDate, datesEqual } from '../config/constants';
import { isClientAppointment } from '../config/storage';

export const WeekCalendar = ({ selectedDate, onSelectDate, appointments }) => {  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = parseLocalDate(selectedDate);
    const day = today.getDay();
    const diff = today.getDate() - (day === 0 ? 6 : day - 1);
    const monday = new Date(today);
    monday.setDate(diff);
    return monday;
  });

  const weekDays = useMemo(() => {
    const days = [];
    const startDate = new Date(currentWeekStart);
    const todayString = toLocalDateString();

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateString = toLocalDateString(date);
      const dayAppointments = (appointments || []).filter((a) => datesEqual(a.date, dateString));
      const clientApps = dayAppointments.filter((a) => isClientAppointment(a) && a.status !== 'cancelled');

      days.push({
        date: dateString,
        dayName: WEEKDAYS[i],
        dayNumber: date.getDate(),
        isToday: dateString === todayString,
        isSelected: datesEqual(dateString, selectedDate),
        appointmentsCount: dayAppointments.length,
        earnings: clientApps.reduce((sum, a) => sum + (a.price || 0), 0),
      });
    }
    return days;
  }, [currentWeekStart, appointments, selectedDate]);  const currentMonth = MONTH_NAMES[currentWeekStart.getMonth()];
  const currentYear = currentWeekStart.getFullYear();

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - (day === 0 ? 6 : day - 1);
    const monday = new Date(today);
    monday.setDate(diff);
    setCurrentWeekStart(monday);
    onSelectDate(toLocalDateString(today));
  };

  return (
    <View style={styles.weekCalendarContainer}>
      <View style={styles.weekCalendarHeader}>
        <TouchableOpacity onPress={() => { const ns = new Date(currentWeekStart); ns.setDate(currentWeekStart.getDate() - 7); setCurrentWeekStart(ns); }} style={styles.weekNavButton}><Text style={styles.weekNavText}>←</Text></TouchableOpacity>
        <View style={styles.weekTitleContainer}>
          <Text style={styles.weekTitle}>{currentMonth} {currentYear}</Text>
          <TouchableOpacity onPress={goToToday}><Text style={styles.todayButton}>Сегодня</Text></TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => { const ns = new Date(currentWeekStart); ns.setDate(currentWeekStart.getDate() + 7); setCurrentWeekStart(ns); }} style={styles.weekNavButton}><Text style={styles.weekNavText}>→</Text></TouchableOpacity>
      </View>
      <View style={styles.weekDaysContainer}>
        {weekDays.map((day, index) => (
          <TouchableOpacity key={index} style={[styles.weekDay, day.isSelected && styles.weekDaySelected, day.isToday && !day.isSelected && styles.weekDayToday]} onPress={() => onSelectDate(day.date)}>
            <Text style={[styles.weekDayName, day.isSelected && styles.weekDayTextSelected]}>{day.dayName}</Text>
            <Text style={[styles.weekDayNumber, day.isSelected && styles.weekDayTextSelected]}>{day.dayNumber}</Text>
            {day.appointmentsCount > 0 && <View style={[styles.weekDayBadge, day.isSelected && styles.weekDayBadgeSelected]}><Text style={[styles.weekDayBadgeText, day.isSelected && styles.weekDayBadgeTextSelected]}>{day.appointmentsCount}</Text></View>}
            {day.earnings > 0 && <Text style={[styles.weekDayEarnings, day.isSelected && styles.weekDayTextSelected]}>{day.earnings}₽</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  weekCalendarContainer: { backgroundColor: COLORS.calendarDarkBg, paddingVertical: 15, marginHorizontal: 15, marginTop: 8, marginBottom: 10, borderRadius: 20, borderWidth: 1, borderColor: '#3A3A3C' },
  weekCalendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, marginBottom: 15 },
  weekNavButton: { padding: 10 },
  weekNavText: { fontSize: 22, color: COLORS.calendarDarkText, fontWeight: 'bold' },
  weekTitleContainer: { alignItems: 'center' },
  weekTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.calendarDarkText },
  todayButton: { fontSize: 13, color: COLORS.primaryLight, marginTop: 3, fontWeight: '500' },
  weekDaysContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 5 },
  weekDay: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 5, borderRadius: 15, minWidth: 45 },
  weekDaySelected: { backgroundColor: COLORS.primary },
  weekDayToday: { borderWidth: 2, borderColor: COLORS.primary },
  weekDayName: { fontSize: 13, color: COLORS.calendarDarkTextMuted, marginBottom: 4 },
  weekDayNumber: { fontSize: 16, fontWeight: 'bold', color: COLORS.calendarDarkText, marginBottom: 4 },
  weekDayTextSelected: { color: COLORS.textOnPrimary },
  weekDayBadge: { backgroundColor: '#9B59B640', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 2 },
  weekDayBadgeSelected: { backgroundColor: COLORS.textOnPrimary },
  weekDayBadgeText: { color: COLORS.primaryLight, fontSize: 10, fontWeight: 'bold' },
  weekDayBadgeTextSelected: { color: COLORS.primary },
  weekDayEarnings: { fontSize: 10, color: COLORS.success, fontWeight: '500' },
});
