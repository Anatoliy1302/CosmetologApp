import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

export default function CustomDateTimePicker({ selectedDate, selectedTime, onSelectDate, onSelectTime }) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(selectedDate ? new Date(selectedDate) : new Date());

  // Получаем следующие 14 дней
  const getNextDays = () => {
    const days = [];
    const today = new Date();
    const weekdays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const isToday = i === 0;
      const dayName = weekdays[date.getDay()];
      const dayNumber = date.getDate();
      const month = months[date.getMonth()];
      
      days.push({
        date: date.toISOString(),
        dayName: isToday ? 'Сегодня' : dayName,
        dayNumber: dayNumber,
        month: month,
        fullDate: date,
      });
    }
    return days;
  };

  const days = getNextDays();

  const handleDateChange = (event, selectedDateValue) => {
    setShowDatePicker(false);
    if (selectedDateValue) {
      setTempDate(selectedDateValue);
      onSelectDate(selectedDateValue.toISOString());
    }
  };

  const handleTimeChange = (event, selectedTimeValue) => {
    setShowTimePicker(false);
    if (selectedTimeValue) {
      const hours = selectedTimeValue.getHours().toString().padStart(2, '0');
      const minutes = selectedTimeValue.getMinutes().toString().padStart(2, '0');
      onSelectTime(`${hours}:${minutes}`);
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'Не выбрана';
    const date = new Date(dateString);
    const weekdays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return `${weekdays[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Выберите дату</Text>
      
      {/* Выбор даты кнопкой */}
      <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
        <Ionicons name="calendar" size={24} color="#ff69b4" />
        <Text style={styles.pickerButtonText}>
          {formatDisplayDate(selectedDate)}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#999" />
      </TouchableOpacity>

      {/* Быстрый выбор даты (горизонтальный скролл) */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.daysScroll}
        contentContainerStyle={styles.daysContainer}
      >
        {days.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayCard,
              selectedDate === day.date && styles.dayCardSelected,
            ]}
            onPress={() => onSelectDate(day.date)}
          >
            <Text style={[
              styles.dayName,
              selectedDate === day.date && styles.dayTextSelected,
            ]}>{day.dayName}</Text>
            <Text style={[
              styles.dayNumber,
              selectedDate === day.date && styles.dayTextSelected,
            ]}>{day.dayNumber}</Text>
            <Text style={[
              styles.dayMonth,
              selectedDate === day.date && styles.dayTextSelected,
            ]}>{day.month}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={[styles.label, { marginTop: 20 }]}>Выберите время</Text>
      
      {/* Выбор времени кнопкой */}
      <TouchableOpacity style={styles.pickerButton} onPress={() => setShowTimePicker(true)}>
        <Ionicons name="time" size={24} color="#ff69b4" />
        <Text style={styles.pickerButtonText}>
          {selectedTime || 'Не выбрано'}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#999" />
      </TouchableOpacity>

      {/* Нативные пикеры */}
      {showDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          locale="ru-RU"
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={new Date(`2000-01-01T${selectedTime || '12:00'}:00`)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
          is24Hour={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  pickerButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  daysScroll: {
    flexGrow: 0,
  },
  daysContainer: {
    paddingRight: 20,
  },
  dayCard: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
    minWidth: 80,
  },
  dayCardSelected: {
    backgroundColor: '#ff69b4',
  },
  dayName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  dayMonth: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  dayTextSelected: {
    color: 'white',
  },
});