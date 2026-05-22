import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

export default function FullDateTimePicker({ onConfirm, onCancel, visible, initialDate, initialTime }) {
  const [tempDate, setTempDate] = useState(initialDate ? new Date(initialDate) : new Date());
  const [tempTime, setTempTime] = useState(() => {
    if (initialTime) {
      const [hours, minutes] = initialTime.split(':');
      const time = new Date();
      time.setHours(parseInt(hours), parseInt(minutes));
      return time;
    }
    const time = new Date();
    time.setHours(12, 0);
    return time;
  });
  const [mode, setMode] = useState('date');

  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
    setMode('time');
  };

  const handleTimeChange = (event, selectedTime) => {
    if (selectedTime) {
      setTempTime(selectedTime);
    }
    onConfirm(tempDate, tempTime);
  };

  const formatDate = (date) => {
    const weekdays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return `${weekdays[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  };

  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Выберите дату и время</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.previewContainer}>
            <View style={styles.previewBox}>
              <Ionicons name="calendar" size={24} color="#ff69b4" />
              <Text style={styles.previewDate}>{formatDate(tempDate)}</Text>
            </View>
            <View style={styles.previewBox}>
              <Ionicons name="time" size={24} color="#ff69b4" />
              <Text style={styles.previewTime}>{formatTime(tempTime)}</Text>
            </View>
          </View>

          {Platform.OS === 'ios' ? (
            <>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                locale="ru-RU"
                minimumDate={new Date()}
                textColor="#ff69b4"
              />
              <DateTimePicker
                value={tempTime}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                is24Hour={true}
                locale="ru-RU"
                textColor="#ff69b4"
              />
              <TouchableOpacity style={styles.doneButton} onPress={() => handleTimeChange(null, tempTime)}>
                <Text style={styles.doneButtonText}>Готово</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
                locale="ru-RU"
              />
              <DateTimePicker
                value={tempTime}
                mode="time"
                display="default"
                onChange={handleTimeChange}
                is24Hour={true}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    overflow: 'hidden',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  previewContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#f9f9f9',
    margin: 15,
    borderRadius: 12,
    justifyContent: 'space-between',
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  previewTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff69b4',
  },
  doneButton: {
    backgroundColor: '#ff69b4',
    margin: 20,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});