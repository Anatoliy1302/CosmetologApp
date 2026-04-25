import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity,
  ScrollView, Alert, SafeAreaView, ActivityIndicator, Modal,
  Linking, Clipboard, Image
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Calendar } from 'react-native-calendars';
import * as SMS from 'expo-sms';
import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, addDoc, updateDoc, query, where,
  onSnapshot, deleteDoc, doc, getDocs
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

// ========== FIREBASE CONFIG ==========
const firebaseConfig = {
  apiKey: "AIzaSyA5rMkK27ymrmcGr0fD9nqE5vxSDAiMsY",
  authDomain: "cosmetologapp.firebaseapp.com",
  projectId: "cosmetologapp",
  storageBucket: "cosmetologapp.firebasestorage.app",
  messagingSenderId: "337897418182",
  appId: "1:337897418182:web:31e7c16bee7c59b4e16c7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ========== СОЗДАЕМ СТЕК ==========
const Stack = createStackNavigator();

// ========== ЦВЕТОВАЯ ПАЛИТРА ==========
const COLORS = {
  primary: '#9B59B6',
  primaryLight: '#D2B4DE',
  primaryDark: '#7D3C98',
  secondary: '#E8DAEF',
  success: '#27AE60',
  successLight: '#D5F5E3',
  warning: '#F39C12',
  warningLight: '#FDEBD0',
  danger: '#E74C3C',
  dangerLight: '#FADBD8',
  info: '#3498DB',
  infoLight: '#D6EAF8',
  background: '#F4F6F9',
  cardBg: '#FFFFFF',
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  textLight: '#95A5A6',
  border: '#E0E0E0',
  shadow: '#000000',
  calendarBg: '#2C3E50',
  headerBg: '#9B59B6',
};

// Массив красивых цветов для фона клиентов
const CLIENT_COLORS = [
  '#FFE4E1', '#E8F8F5', '#FEF9E7', '#F4ECF7', '#E8DAEF',
  '#D6EAF8', '#FDEDEC', '#E8F6F3', '#FEF5E7', '#F5EEF8',
  '#FFE4E1', '#E0F7FA', '#FFF3E0', '#F3E5F5', '#E8F5E9',
];

const getClientColor = (phone) => {
  if (!phone) return CLIENT_COLORS[0];
  const sum = phone.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CLIENT_COLORS[sum % CLIENT_COLORS.length];
};

// ========== ШАБЛОНЫ НАПОМИНАНИЙ ==========
const REMINDER_TEMPLATES = {
  day_before: '{client_name}, напоминаем о завтрашней записи!\n\nУслуга: {service}\nДата: {date}\nВремя: {time}\nСтоимость: {price} ₽\n\n📍 Ждём вас!\n\nКосметолог Альбина',
  confirmation: '{client_name}, вы записаны!\n\nУслуга: {service}\nДата: {date}\nВремя: {time}\nСтоимость: {price} ₽\n\n📍 Ждём вас!\n\nКосметолог Альбина'
};

const formatTemplate = (template, data) => {
  return template
    .replace(/{client_name}/g, data.clientName || '')
    .replace(/{service}/g, data.service || '')
    .replace(/{date}/g, data.date || '')
    .replace(/{time}/g, data.time || '')
    .replace(/{price}/g, data.price || '0');
};

// ========== КОНСТАНТЫ ==========
const HOURS = Array.from({ length: 15 }, (_, i) => String(i + 8).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

// ========== ФОРМАТИРОВАНИЕ ДАТЫ ==========
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
};

const formatShortDate = (dateString) => {
  if (!dateString) return 'Нет';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Нет';
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
};

// ========== ИСПРАВЛЕННЫЙ ВЫБОР ВРЕМЕНИ (КОЛЁСИКИ) ==========
const TimePickerModal = ({ visible, onClose, onSelect, initialTime }) => {
  const initialHour = initialTime ? initialTime.split(':')[0] : '09';
  const initialMinute = initialTime ? initialTime.split(':')[1] : '00';

  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);

  const handleConfirm = () => {
    onSelect(`${selectedHour}:${selectedMinute}`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.timePickerContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Выберите время</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Часы</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedHour}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                  onValueChange={(itemValue) => setSelectedHour(itemValue)}
                >
                  {HOURS.map((hour) => (
                    <Picker.Item key={hour} label={hour} value={hour} color={COLORS.textPrimary} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Минуты</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedMinute}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                  onValueChange={(itemValue) => setSelectedMinute(itemValue)}
                >
                  {MINUTES.map((minute) => (
                    <Picker.Item key={minute} label={minute} value={minute} color={COLORS.textPrimary} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.timePickerFooter}>
            <Text style={styles.selectedTimePreview}>{selectedHour}:{selectedMinute}</Text>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Подтвердить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.modalOverlayTouchable} 
        activeOpacity={1} 
        onPress={onClose} 
      />
    </Modal>
  );
};

// ========== БЫСТРЫЙ ВЫБОР ВРЕМЕНИ ==========
const TimeSelector = ({ value, onSelect }) => {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <>
      <TouchableOpacity style={styles.timeSelector} onPress={() => setShowPicker(true)}>
        <Text style={[styles.timeSelectorText, !value && { color: COLORS.textLight }]}>
          {value || 'Выберите время'}
        </Text>
      </TouchableOpacity>

      <TimePickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={(t) => {
          onSelect(t);
          setShowPicker(false);
        }}
        initialTime={value}
      />
    </>
  );
};

// ========== КОМПОНЕНТ ДЛЯ ОТОБРАЖЕНИЯ НАПОМИНАНИЙ ==========
const DayReminders = ({ appointments, onSendReminder }) => {
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowString = tomorrowDate.toISOString().split('T')[0];
  
  const tomorrowAppointments = appointments[tomorrowString] || [];
  const clientAppointments = tomorrowAppointments.filter(app => app.type === 'client' || !app.type);
  
  if (clientAppointments.length === 0) {
    return null;
  }

  return (
    <View style={styles.remindersContainer}>
      <View style={styles.remindersHeader}>
        <Text style={styles.remindersTitle}>🔔 Напоминания на завтра</Text>
        <Text style={styles.remindersCount}>{clientAppointments.length} записей</Text>
      </View>
      
      {clientAppointments.map((app) => (
        <View key={app.id} style={styles.reminderCard}>
          <View style={styles.reminderInfo}>
            <Text style={styles.reminderTime}>{app.time}</Text>
            <View style={styles.reminderDetails}>
              <Text style={styles.reminderClient}>{app.clientName}</Text>
              <Text style={styles.reminderService}>{app.service}</Text>
            </View>
          </View>
          
          <View style={styles.reminderActions}>
            {app.reminderSent ? (
              <View style={styles.reminderSentBadge}>
                <Text style={styles.reminderSentText}>✓ Отправлено</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.sendReminderButton}
                onPress={() => onSendReminder(app)}
              >
                <Text style={styles.sendReminderText}>📱 Напомнить</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

// ========== НЕДЕЛЬНЫЙ КАЛЕНДАРЬ ==========
const WeekCalendar = ({ selectedDate, onSelectDate, appointments }) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date(selectedDate);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
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
      const dayAppointments = appointments[dateString] || [];
      
      days.push({
        date: dateString,
        dayName: WEEKDAYS[i],
        dayNumber: date.getDate(),
        isToday: dateString === new Date().toISOString().split('T')[0],
        isSelected: dateString === selectedDate,
        appointmentsCount: dayAppointments.length,
        earnings: dayAppointments.reduce((sum, app) => sum + (app.price || 0), 0)
      });
    }
    
    return days;
  };

  const weekDays = getWeekDays();
  const currentMonth = MONTH_NAMES[currentWeekStart.getMonth()];
  const currentYear = currentWeekStart.getFullYear();

  const goToPrevWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diff);
    setCurrentWeekStart(monday);
    onSelectDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <View style={styles.weekCalendarContainer}>
      <View style={styles.weekCalendarHeader}>
        <TouchableOpacity onPress={goToPrevWeek} style={styles.weekNavButton}>
          <Text style={styles.weekNavText}>←</Text>
        </TouchableOpacity>
        <View style={styles.weekTitleContainer}>
          <Text style={styles.weekTitle}>{currentMonth} {currentYear}</Text>
          <TouchableOpacity onPress={goToToday}>
            <Text style={styles.todayButton}>Сегодня</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={goToNextWeek} style={styles.weekNavButton}>
          <Text style={styles.weekNavText}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekDaysContainer}>
        {weekDays.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.weekDay,
              day.isSelected && styles.weekDaySelected,
              day.isToday && styles.weekDayToday
            ]}
            onPress={() => onSelectDate(day.date)}
          >
            <Text style={[styles.weekDayName, day.isSelected && styles.weekDayTextSelected]}>
              {day.dayName}
            </Text>
            <Text style={[styles.weekDayNumber, day.isSelected && styles.weekDayTextSelected]}>
              {day.dayNumber}
            </Text>
            {day.appointmentsCount > 0 && (
              <View style={[styles.weekDayBadge, day.isSelected && styles.weekDayBadgeSelected]}>
                <Text style={styles.weekDayBadgeText}>{day.appointmentsCount}</Text>
              </View>
            )}
            {day.earnings > 0 && (
              <Text style={[styles.weekDayEarnings, day.isSelected && styles.weekDayTextSelected]}>
                {day.earnings}₽
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ========== СТАТИСТИКА ==========
const StatsScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalEarnings: 0,
    monthEarnings: 0,
    weekEarnings: 0,
    totalClients: 0,
    totalAppointments: 0,
    averageCheck: 0,
    popularService: '',
    topClients: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'appointments'));
      const appointments = [];
      snapshot.forEach(doc => appointments.push({ id: doc.id, ...doc.data() }));

      const clientApps = appointments.filter(app => app.type === 'client' || !app.type);
      
      const totalEarnings = clientApps.reduce((sum, app) => sum + (app.price || 0), 0);
      
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const monthApps = clientApps.filter(app => app.date?.startsWith(currentMonth));
      const monthEarnings = monthApps.reduce((sum, app) => sum + (app.price || 0), 0);
      
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekApps = clientApps.filter(app => {
        if (!app.date) return false;
        const appDate = new Date(app.date);
        return appDate >= weekStart && appDate <= weekEnd;
      });
      const weekEarnings = weekApps.reduce((sum, app) => sum + (app.price || 0), 0);
      
      const clientsMap = new Map();
      clientApps.forEach(app => {
        if (app.clientPhoneNormalized) {
          clientsMap.set(app.clientPhoneNormalized, {
            name: app.clientName,
            phone: app.clientPhone,
            visits: (clientsMap.get(app.clientPhoneNormalized)?.visits || 0) + 1,
            totalSpent: (clientsMap.get(app.clientPhoneNormalized)?.totalSpent || 0) + (app.price || 0)
          });
        }
      });
      const totalClients = clientsMap.size;
      
      const averageCheck = clientApps.length > 0 ? Math.round(totalEarnings / clientApps.length) : 0;
      
      const serviceMap = new Map();
      clientApps.forEach(app => {
        if (app.service) {
          serviceMap.set(app.service, (serviceMap.get(app.service) || 0) + 1);
        }
      });
      let popularService = '';
      let maxCount = 0;
      serviceMap.forEach((count, service) => {
        if (count > maxCount) {
          maxCount = count;
          popularService = service;
        }
      });
      
      const topClients = Array.from(clientsMap.values())
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);
      
      setStats({
        totalEarnings,
        monthEarnings,
        weekEarnings,
        totalClients,
        totalAppointments: clientApps.length,
        averageCheck,
        popularService,
        topClients
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Статистика</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: COLORS.primaryLight }]}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={[styles.statValue, { color: COLORS.primaryDark }]}>{stats.totalEarnings} ₽</Text>
              <Text style={styles.statLabel}>Общая выручка</Text>
            </View>
            
            <View style={styles.statRow}>
              <View style={[styles.statCard, styles.statCardHalf, { backgroundColor: COLORS.infoLight }]}>
                <Text style={styles.statIcon}>📅</Text>
                <Text style={[styles.statValue, { color: COLORS.info }]}>{stats.monthEarnings} ₽</Text>
                <Text style={styles.statLabel}>За месяц</Text>
              </View>
              
              <View style={[styles.statCard, styles.statCardHalf, { backgroundColor: COLORS.successLight }]}>
                <Text style={styles.statIcon}>📆</Text>
                <Text style={[styles.statValue, { color: COLORS.success }]}>{stats.weekEarnings} ₽</Text>
                <Text style={styles.statLabel}>За неделю</Text>
              </View>
            </View>
            
            <View style={styles.statRow}>
              <View style={[styles.statCard, styles.statCardHalf, { backgroundColor: COLORS.warningLight }]}>
                <Text style={styles.statIcon}>👥</Text>
                <Text style={[styles.statValue, { color: COLORS.warning }]}>{stats.totalClients}</Text>
                <Text style={styles.statLabel}>Клиентов</Text>
              </View>
              
              <View style={[styles.statCard, styles.statCardHalf, { backgroundColor: COLORS.dangerLight }]}>
                <Text style={styles.statIcon}>📋</Text>
                <Text style={[styles.statValue, { color: COLORS.danger }]}>{stats.totalAppointments}</Text>
                <Text style={styles.statLabel}>Записей</Text>
              </View>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: COLORS.secondary }]}>
              <Text style={styles.statIcon}>💳</Text>
              <Text style={[styles.statValue, { color: COLORS.primary }]}>{stats.averageCheck} ₽</Text>
              <Text style={styles.statLabel}>Средний чек</Text>
            </View>
            
            {stats.popularService && (
              <View style={[styles.statCard, { backgroundColor: '#F5EEF8' }]}>
                <Text style={styles.statIcon}>⭐</Text>
                <Text style={[styles.statValue, { color: COLORS.primaryDark }]}>{stats.popularService}</Text>
                <Text style={styles.statLabel}>Популярная услуга</Text>
              </View>
            )}
          </View>
          
          {stats.topClients.length > 0 && (
            <View style={styles.topClientsSection}>
              <Text style={styles.sectionTitle}>🏆 Топ клиентов</Text>
              {stats.topClients.map((client, index) => {
                const clientColor = getClientColor(client.phone);
                return (
                  <View key={index} style={[styles.topClientCard, { backgroundColor: clientColor }]}>
                    <View style={[styles.topClientRank, { backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : COLORS.primary }]}>
                      <Text style={styles.topClientRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.topClientInfo}>
                      <Text style={styles.topClientName}>{client.name}</Text>
                      <Text style={styles.topClientPhone}>{client.phone}</Text>
                    </View>
                    <View style={styles.topClientStats}>
                      <Text style={styles.topClientSpent}>{client.totalSpent} ₽</Text>
                      <Text style={styles.topClientVisits}>{client.visits} визитов</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// ========== ОСНОВНОЙ ЭКРАН КАЛЕНДАРЯ ==========
const CalendarScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [monthCalendarVisible, setMonthCalendarVisible] = useState(false);
  const [showReminders, setShowReminders] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'appointments'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allApps = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (!allApps[data.date]) allApps[data.date] = [];
        allApps[data.date].push({ id: docSnap.id, ...data });
      });
      setAllAppointments(allApps);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    setLoading(true);
    const appsForDay = allAppointments[selectedDate] || [];
    appsForDay.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    setAppointments(appsForDay);
    setLoading(false);
  }, [selectedDate, allAppointments]);

  useEffect(() => {
    loadReminderSetting();
  }, []);

  const loadReminderSetting = async () => {
    try {
      const value = await AsyncStorage.getItem('showReminders');
      if (value !== null) {
        setShowReminders(value === 'true');
      }
    } catch (error) {
      console.error('Error loading reminder setting:', error);
    }
  };

  const toggleReminders = async () => {
    const newValue = !showReminders;
    setShowReminders(newValue);
    try {
      await AsyncStorage.setItem('showReminders', String(newValue));
    } catch (error) {
      console.error('Error saving reminder setting:', error);
    }
  };

  const dailyEarnings = appointments.reduce((sum, item) => {
    if (item.type === 'client' || !item.type) {
      return sum + (item.price || 0);
    }
    return sum;
  }, 0);

  const clientAppointments = appointments.filter(app => app.type === 'client' || !app.type);
  const personalAppointments = appointments.filter(app => app.type === 'personal');

  const openContextMenu = (appointment) => {
    setSelectedAppointment(appointment);
    setContextMenuVisible(true);
  };

  const formatSelectedDate = () => {
    const date = new Date(selectedDate);
    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
    return `${date.getDate()} ${MONTH_NAMES[date.getMonth()].toLowerCase()}, ${WEEKDAYS[dayIndex]}`;
  };

  const sendReminder = async (appointment) => {
    if (!appointment || appointment.type !== 'client') return;
    
    const message = formatTemplate(REMINDER_TEMPLATES.day_before, {
      clientName: appointment.clientName,
      service: appointment.service,
      date: formatDate(appointment.date),
      time: appointment.time,
      price: appointment.price
    });
    
    Alert.alert(
      '📱 Отправить напоминание',
      'Выберите способ отправки',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: '📱 SMS', 
          onPress: async () => {
            const isAvailable = await SMS.isAvailableAsync();
            if (isAvailable) {
              await SMS.sendSMSAsync([appointment.clientPhone], message);
              await updateDoc(doc(db, 'appointments', appointment.id), {
                reminderSent: true,
                reminderSentAt: new Date()
              });
            }
          }
        },
        { 
          text: '💬 WhatsApp', 
          onPress: async () => {
            const phone = appointment.clientPhone.replace(/[^0-9]/g, '');
            const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
            const supported = await Linking.canOpenURL(url);
            if (supported) {
              await Linking.openURL(url);
              await updateDoc(doc(db, 'appointments', appointment.id), {
                reminderSent: true,
                reminderSentAt: new Date()
              });
            }
          }
        }
      ]
    );
  };

  const callClient = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Ошибка', 'Не удалось позвонить');
    });
  };

  const renderAppointmentCard = ({ item }) => {
    const isClient = item.type === 'client' || !item.type;
    const isPersonal = item.type === 'personal';
    const isBreak = item.type === 'break';
    
    const cardBgColor = isClient ? COLORS.dangerLight : (isPersonal ? COLORS.successLight : COLORS.warningLight);
    const borderColor = isClient ? COLORS.danger : (isPersonal ? COLORS.success : COLORS.warning);
    const timeBgColor = isClient ? COLORS.danger + '20' : (isPersonal ? COLORS.success + '20' : COLORS.warning + '20');
    const timeColor = isClient ? COLORS.danger : (isPersonal ? COLORS.success : COLORS.warning);

    const cardStyle = {
      ...styles.card,
      backgroundColor: cardBgColor,
      borderLeftWidth: 4,
      borderLeftColor: borderColor
    };

    return (
      <View style={cardStyle}>
        <TouchableOpacity 
          style={styles.cardContentTouchable}
          onPress={() => navigation.navigate('EditAppointment', { appointment: item })} 
          onLongPress={() => openContextMenu(item)}
        >
          <View style={styles.cardContent}>
            <View style={[styles.timeContainer, { backgroundColor: timeBgColor }]}>
              <Text style={[styles.time, { color: timeColor }]}>
                {item.time}
              </Text>
            </View>
            <View style={styles.infoContainer}>
              {isClient ? (
                <>
                  <Text style={styles.cardClient}>{item.clientName}</Text>
                  <Text style={styles.cardPhone}>{item.clientPhone}</Text>
                  <Text style={styles.cardService}>{item.service}</Text>
                  {item.comment ? (
                    <Text style={styles.cardComment} numberOfLines={1}>💬 {item.comment}</Text>
                  ) : null}
                  <Text style={styles.cardPrice}>{item.price} ₽</Text>
                </>
              ) : isPersonal ? (
                <>
                  <Text style={styles.cardClient}>📝 {item.title || 'Личная запись'}</Text>
                  {item.description ? (
                    <Text style={styles.cardComment} numberOfLines={2}>{item.description}</Text>
                  ) : null}
                </>
              ) : (
                <>
                  <Text style={styles.cardClient}>☕ Перерыв</Text>
                  {item.description ? (
                    <Text style={styles.cardComment} numberOfLines={1}>{item.description}</Text>
                  ) : null}
                </>
              )}
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>
        
        {isClient && (
          <View style={styles.cardQuickActions}>
            <TouchableOpacity style={styles.quickCallButton} onPress={() => callClient(item.clientPhone)}>
              <Text style={styles.quickCallText}>📞 Позвонить</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('./assets/logo.png')}
          style={styles.logoImage}
          resizeMode="cover"
        />
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggleReminders} style={styles.headerButtonWrapper}>
            <Text style={[styles.headerButton, !showReminders && styles.headerButtonInactive]}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Stats')} style={styles.headerButtonWrapper}>
            <Text style={styles.headerButton}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMonthCalendarVisible(true)} style={styles.headerButtonWrapper}>
            <Text style={styles.headerButton}>📅</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AllRecords')} style={styles.headerButtonWrapper}>
            <Text style={styles.headerButton}>📋</Text>
          </TouchableOpacity>
        </View>
      </View>

      <WeekCalendar 
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        appointments={allAppointments}
      />

      <View style={styles.selectedDateHeader}>
        <Text style={styles.selectedDateText}>{formatSelectedDate()}</Text>
      </View>

      {showReminders && (
        <DayReminders 
          appointments={allAppointments} 
          onSendReminder={sendReminder}
        />
      )}

      <View style={styles.earningsBar}>
        <Text style={styles.earningsText}>💰 {dailyEarnings} ₽</Text>
        <Text style={styles.appointmentsCount}>
          📋 {clientAppointments.length} клиентов • 📝 {personalAppointments.length} личных
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={appointments}
          renderItem={renderAppointmentCard}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>Нет записей на этот день</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => {
          Alert.alert(
            '➕ Новая запись',
            'Что вы хотите добавить?',
            [
              { text: 'Отмена', style: 'cancel' },
              { 
                text: '👤 Запись клиента', 
                onPress: () => navigation.navigate('NewAppointment', { selectedDate })
              },
              { 
                text: '📝 Личная запись', 
                onPress: () => navigation.navigate('NewPersonalNote', { selectedDate })
              },
              { 
                text: '☕ Перерыв', 
                onPress: () => navigation.navigate('NewBreak', { selectedDate })
              }
            ]
          );
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={monthCalendarVisible} transparent animationType="slide">
        <View style={styles.monthModalOverlay}>
          <View style={styles.monthModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Выберите дату</Text>
              <TouchableOpacity onPress={() => setMonthCalendarVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Calendar
              current={selectedDate}
              onDayPress={(day) => {
                setSelectedDate(day.dateString);
                setMonthCalendarVisible(false);
              }}
              markedDates={{
                [selectedDate]: { selected: true, selectedColor: COLORS.primary }
              }}
              theme={{
                backgroundColor: COLORS.calendarBg,
                calendarBackground: COLORS.calendarBg,
                selectedDayBackgroundColor: COLORS.primary,
                todayTextColor: COLORS.primary,
                arrowColor: '#FFFFFF',
                monthTextColor: '#FFFFFF',
                textMonthFontWeight: 'bold',
                textDayFontSize: 14,
                textMonthFontSize: 16,
                dayTextColor: '#FFFFFF',
                textDisabledColor: '#95A5A6',
                textSectionTitleColor: '#FFFFFF',
              }}
            />
            
            <TouchableOpacity 
              style={styles.closeMonthButton}
              onPress={() => setMonthCalendarVisible(false)}
            >
              <Text style={styles.closeMonthButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={contextMenuVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.contextMenuOverlay} activeOpacity={1} onPress={() => setContextMenuVisible(false)}>
          <View style={styles.contextMenu}>
            <TouchableOpacity style={styles.contextMenuItem} onPress={() => {
              setContextMenuVisible(false);
              navigation.navigate('EditAppointment', { appointment: selectedAppointment });
            }}>
              <Text style={styles.contextMenuText}>✏️ Редактировать</Text>
            </TouchableOpacity>
            
            {(selectedAppointment?.type === 'client' || !selectedAppointment?.type) && (
              <>
                <TouchableOpacity style={styles.contextMenuItem} onPress={() => {
                  setContextMenuVisible(false);
                  callClient(selectedAppointment?.clientPhone);
                }}>
                  <Text style={styles.contextMenuText}>📞 Позвонить</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.contextMenuItem} onPress={() => {
                  setContextMenuVisible(false);
                  sendReminder(selectedAppointment);
                }}>
                  <Text style={styles.contextMenuText}>📱 Напомнить</Text>
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity style={styles.contextMenuItem} onPress={() => {
              Alert.alert('Удалить запись?', '', [
                { text: 'Отмена', style: 'cancel' },
                { text: 'Удалить', style: 'destructive', onPress: async () => {
                  if (selectedAppointment?.id) {
                    await deleteDoc(doc(db, 'appointments', selectedAppointment.id));
                  }
                  setContextMenuVisible(false);
                }}
              ]);
            }}>
              <Text style={[styles.contextMenuText, styles.contextMenuDelete]}>🗑️ Удалить</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

// ========== ВСЕ ЗАПИСИ ==========
const AllRecordsScreen = ({ navigation }) => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const q = query(collection(db, 'appointments'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => {
        if (a.date !== b.date) {
          return (a.date || '').localeCompare(b.date || '');
        }
        return (a.time || '').localeCompare(b.time || '');
      });
      setRecords(list);
      applyFilter(list, search, filterType);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const applyFilter = (list, searchText, type) => {
    let filtered = [...list];
    
    if (type === 'clients') {
      filtered = filtered.filter(r => r.type === 'client' || !r.type);
    } else if (type === 'personal') {
      filtered = filtered.filter(r => r.type === 'personal');
    } else if (type === 'breaks') {
      filtered = filtered.filter(r => r.type === 'break');
    }
    
    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      filtered = filtered.filter(r => {
        const name = r.clientName || r.title || '';
        const phone = r.clientPhone || '';
        const service = r.service || '';
        const description = r.description || '';
        
        return name.toLowerCase().includes(query) ||
               phone.includes(query) ||
               service.toLowerCase().includes(query) ||
               description.toLowerCase().includes(query);
      });
    }
    
    setFilteredRecords(filtered);
  };

  useEffect(() => {
    applyFilter(records, search, filterType);
  }, [search, filterType]);

  const getRecordIcon = (record) => {
    const type = record.type || 'client';
    if (type === 'client') return '👤';
    if (type === 'personal') return '📝';
    return '☕';
  };

  const getRecordColor = (record) => {
    const type = record.type || 'client';
    if (type === 'client') return COLORS.danger;
    if (type === 'personal') return COLORS.success;
    return COLORS.warning;
  };

  const getRecordBgColor = (record) => {
    const type = record.type || 'client';
    if (type === 'client') {
      return getClientColor(record.clientPhone);
    }
    if (type === 'personal') return COLORS.successLight;
    return COLORS.warningLight;
  };

  const getRecordTitle = (record) => {
    const type = record.type || 'client';
    if (type === 'client') return record.clientName || 'Без имени';
    if (type === 'personal') return record.title || 'Личная запись';
    return 'Перерыв';
  };

  const getRecordSubtitle = (record) => {
    const type = record.type || 'client';
    if (type === 'client') return `${record.service || ''} • ${record.clientPhone || ''}`;
    if (type === 'personal') return record.description || '';
    return record.description || `Длительность: ${record.duration || 30} мин`;
  };

  const getRecordDate = (record) => {
    return `${formatShortDate(record.date)} в ${record.time}`;
  };

  const handleRecordPress = (record) => {
    navigation.navigate('EditAppointment', { appointment: record });
  };

  const callClient = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Ошибка', 'Не удалось позвонить');
    });
  };

  const renderRecordCard = ({ item }) => {
    const color = getRecordColor(item);
    const bgColor = getRecordBgColor(item);
    const isClient = item.type === 'client' || !item.type;
    
    return (
      <TouchableOpacity 
        style={[styles.recordCard, { backgroundColor: bgColor, borderLeftColor: color }]}
        onPress={() => handleRecordPress(item)}
      >
        <View style={styles.recordCardHeader}>
          <View style={[styles.recordIconContainer, { backgroundColor: color + '20' }]}>
            <Text style={styles.recordIcon}>{getRecordIcon(item)}</Text>
          </View>
          <View style={styles.recordInfo}>
            <Text style={styles.recordTitle}>{getRecordTitle(item)}</Text>
            {getRecordSubtitle(item) ? (
              <Text style={styles.recordSubtitle} numberOfLines={1}>
                {getRecordSubtitle(item)}
              </Text>
            ) : null}
            <Text style={styles.recordDate}>{getRecordDate(item)}</Text>
          </View>
          {isClient && item.clientPhone && (
            <TouchableOpacity 
              style={[styles.recordCallButton, { backgroundColor: COLORS.infoLight }]}
              onPress={() => callClient(item.clientPhone)}
            >
              <Text style={styles.recordCallIcon}>📞</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {isClient && item.price > 0 && (
          <View style={styles.recordFooter}>
            <Text style={[styles.recordPrice, { color: COLORS.success }]}>{item.price} ₽</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const FilterButton = ({ title, value, emoji }) => (
    <TouchableOpacity 
      style={[styles.filterButton, filterType === value && { backgroundColor: COLORS.primary }]}
      onPress={() => setFilterType(value)}
    >
      <Text style={[styles.filterButtonText, filterType === value && styles.filterButtonTextActive]}>
        {emoji} {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Все записи</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput 
          style={styles.searchInput} 
          placeholder="Поиск по имени, телефону или услуге" 
          value={search} 
          onChangeText={setSearch} 
          placeholderTextColor={COLORS.textLight}
        />
        {search !== '' && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton title="Все" value="all" emoji="📋" />
          <FilterButton title="Клиенты" value="clients" emoji="👤" />
          <FilterButton title="Личные" value="personal" emoji="📝" />
          <FilterButton title="Перерывы" value="breaks" emoji="☕" />
        </ScrollView>
      </View>

      <View style={styles.recordsStats}>
        <Text style={styles.recordsStatsText}>
          Найдено записей: {filteredRecords.length}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredRecords}
          renderItem={renderRecordCard}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>
                {search ? 'Ничего не найдено' : 'Нет записей'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

// ========== НОВАЯ ЗАПИСЬ КЛИЕНТА ==========
const NewAppointmentScreen = ({ route, navigation }) => {
  const { selectedDate, clientPrefill } = route.params || {};
  const [clientName, setClientName] = useState(clientPrefill?.name || '');
  const [phone, setPhone] = useState(clientPrefill?.phone || '');
  const [service, setService] = useState('');
  const [date, setDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [price, setPrice] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const save = async () => {
    if (!clientName || !phone || !service || !date || !time) {
      Alert.alert('Ошибка', 'Заполните обязательные поля');
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        type: 'client',
        clientName: clientName.trim(),
        clientPhone: phone.trim(),
        clientPhoneNormalized: phone.replace(/[^0-9]/g, ''),
        service: service.trim(),
        date: date.trim(),
        time: time.trim(),
        price: parseInt(price, 10) || 0,
        comment: comment.trim(),
        reminderSent: false,
        createdAt: new Date()
      });

      showNotificationOptions();
      
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить запись');
      setSaving(false);
    }
  };

  const showNotificationOptions = () => {
    const message = formatTemplate(REMINDER_TEMPLATES.confirmation, {
      clientName,
      service,
      date: formatDate(date),
      time,
      price: price || '0'
    });
    
    Alert.alert(
      '✅ Запись добавлена!',
      'Как отправить подтверждение клиенту?',
      [
        { 
          text: 'Позже', 
          style: 'cancel',
          onPress: () => {
            setSaving(false);
            navigation.goBack();
          }
        },
        { 
          text: '📋 Копировать', 
          onPress: () => {
            Clipboard.setString(message);
            Alert.alert('Скопировано', 'Текст подтверждения скопирован');
            setSaving(false);
            navigation.goBack();
          }
        },
        { 
          text: '💬 WhatsApp', 
          onPress: async () => {
            setSaving(false);
            const cleanPhone = phone.replace(/[^0-9]/g, '');
            const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
            
            const supported = await Linking.canOpenURL(url);
            if (supported) {
              await Linking.openURL(url);
            } else {
              Alert.alert('Ошибка', 'WhatsApp не установлен');
            }
            navigation.goBack();
          }
        },
        { 
          text: '📱 SMS', 
          onPress: async () => {
            setSaving(false);
            const isAvailable = await SMS.isAvailableAsync();
            if (isAvailable) {
              await SMS.sendSMSAsync([phone], message);
            } else {
              Alert.alert('Ошибка', 'SMS недоступны на этом устройстве');
            }
            navigation.goBack();
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
      <SafeAreaView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Назад</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Новая запись</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>👤 Имя клиента *</Text>
          <TextInput style={styles.input} value={clientName} onChangeText={setClientName} placeholder="Иван Иванов" placeholderTextColor={COLORS.textLight} />

          <Text style={styles.label}>📞 Телефон *</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+7 999 123-45-67" keyboardType="phone-pad" placeholderTextColor={COLORS.textLight} />

          <Text style={styles.label}>💆‍♀️ Услуга *</Text>
          <TextInput style={styles.input} value={service} onChangeText={setService} placeholder="Название услуги" placeholderTextColor={COLORS.textLight} />

          <Text style={styles.label}>📅 Дата *</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(!showCalendar)}>
            <Text style={styles.dateButtonText}>{date ? formatDate(date) : 'Выберите дату'}</Text>
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>
          {showCalendar && (
            <Calendar
              onDayPress={(day) => { setDate(day.dateString); setShowCalendar(false); }}
              markedDates={{ [date]: { selected: true, selectedColor: COLORS.primary } }}
              theme={{ selectedDayBackgroundColor: COLORS.primary, todayTextColor: COLORS.primary, arrowColor: COLORS.primary }}
              style={styles.inlineCalendar}
            />
          )}

          <Text style={styles.label}>⏰ Время *</Text>
          <TimeSelector value={time} onSelect={setTime} />

          <Text style={styles.label}>💰 Стоимость (₽)</Text>
          <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="0" keyboardType="numeric" placeholderTextColor={COLORS.textLight} />

          <Text style={styles.label}>💬 Комментарий</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            value={comment} 
            onChangeText={setComment} 
            placeholder="Дополнительная информация..."
            multiline
            numberOfLines={3}
            placeholderTextColor={COLORS.textLight}
          />

          <TouchableOpacity style={[styles.saveButton, { backgroundColor: COLORS.primary }, saving && styles.saveButtonDisabled]} onPress={save} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? 'Сохранение...' : '✓ Сохранить запись'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

// ========== НОВАЯ ЛИЧНАЯ ЗАПИСЬ ==========
const NewPersonalNoteScreen = ({ route, navigation }) => {
  const { selectedDate } = route.params || {};
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const save = async () => {
    if (!title || !date || !time) {
      Alert.alert('Ошибка', 'Заполните обязательные поля');
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        type: 'personal',
        title: title.trim(),
        description: description.trim(),
        date: date.trim(),
        time: time.trim(),
        createdAt: new Date()
      });
      Alert.alert('Успех', 'Личная запись добавлена');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
      <SafeAreaView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Назад</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Личная запись</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>📝 Заголовок *</Text>
          <TextInput 
            style={styles.input} 
            value={title} 
            onChangeText={setTitle} 
            placeholder="Например: Закупка материалов"
            placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.label}>📅 Дата *</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(!showCalendar)}>
            <Text style={styles.dateButtonText}>{date ? formatDate(date) : 'Выберите дату'}</Text>
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>
          {showCalendar && (
            <Calendar
              onDayPress={(day) => { setDate(day.dateString); setShowCalendar(false); }}
              markedDates={{ [date]: { selected: true, selectedColor: COLORS.success } }}
              theme={{ selectedDayBackgroundColor: COLORS.success, todayTextColor: COLORS.success, arrowColor: COLORS.success }}
              style={styles.inlineCalendar}
            />
          )}

          <Text style={styles.label}>⏰ Время *</Text>
          <TimeSelector value={time} onSelect={setTime} />

          <Text style={styles.label}>📄 Описание</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            value={description} 
            onChangeText={setDescription} 
            placeholder="Дополнительная информация..."
            multiline
            numberOfLines={4}
            placeholderTextColor={COLORS.textLight}
          />

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: COLORS.success }, saving && styles.saveButtonDisabled]} 
            onPress={save} 
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Сохранение...' : '✓ Сохранить'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

// ========== НОВЫЙ ПЕРЕРЫВ ==========
const NewBreakScreen = ({ route, navigation }) => {
  const { selectedDate } = route.params || {};
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [saving, setSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const save = async () => {
    if (!date || !time) {
      Alert.alert('Ошибка', 'Выберите дату и время');
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        type: 'break',
        title: 'Перерыв',
        description: description.trim() || `Перерыв ${duration} мин`,
        date: date.trim(),
        time: time.trim(),
        duration: parseInt(duration, 10) || 30,
        createdAt: new Date()
      });
      Alert.alert('Успех', 'Перерыв добавлен');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
      <SafeAreaView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Назад</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Перерыв</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>📅 Дата *</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(!showCalendar)}>
            <Text style={styles.dateButtonText}>{date ? formatDate(date) : 'Выберите дату'}</Text>
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>
          {showCalendar && (
            <Calendar
              onDayPress={(day) => { setDate(day.dateString); setShowCalendar(false); }}
              markedDates={{ [date]: { selected: true, selectedColor: COLORS.warning } }}
              theme={{ selectedDayBackgroundColor: COLORS.warning, todayTextColor: COLORS.warning, arrowColor: COLORS.warning }}
              style={styles.inlineCalendar}
            />
          )}

          <Text style={styles.label}>⏰ Время начала *</Text>
          <TimeSelector value={time} onSelect={setTime} />

          <Text style={styles.label}>⏱ Длительность (минут)</Text>
          <TextInput 
            style={styles.input} 
            value={duration} 
            onChangeText={setDuration} 
            placeholder="30" 
            keyboardType="numeric"
            placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.label}>📄 Примечание</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            value={description} 
            onChangeText={setDescription} 
            placeholder="Например: Обед"
            multiline
            numberOfLines={2}
            placeholderTextColor={COLORS.textLight}
          />

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: COLORS.warning }, saving && styles.saveButtonDisabled]} 
            onPress={save} 
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Сохранение...' : '✓ Сохранить'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

// ========== РЕДАКТИРОВАНИЕ ЗАПИСИ ==========
const EditAppointmentScreen = ({ route, navigation }) => {
  const { appointment } = route.params;
  const isClient = appointment?.type === 'client' || !appointment?.type;
  const isPersonal = appointment?.type === 'personal';
  const isBreak = appointment?.type === 'break';
  
  const [clientName, setClientName] = useState(appointment?.clientName || '');
  const [phone, setPhone] = useState(appointment?.clientPhone || '');
  const [service, setService] = useState(appointment?.service || '');
  const [title, setTitle] = useState(appointment?.title || '');
  const [description, setDescription] = useState(appointment?.description || '');
  const [date, setDate] = useState(appointment?.date || '');
  const [time, setTime] = useState(appointment?.time || '');
  const [price, setPrice] = useState(appointment?.price?.toString() || '');
  const [comment, setComment] = useState(appointment?.comment || '');
  const [duration, setDuration] = useState(appointment?.duration?.toString() || '30');
  const [saving, setSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const update = async () => {
    if (!date || !time) {
      Alert.alert('Ошибка', 'Заполните дату и время');
      return;
    }

    if (isClient && (!clientName || !phone || !service)) {
      Alert.alert('Ошибка', 'Заполните обязательные поля');
      return;
    }

    if (isPersonal && !title) {
      Alert.alert('Ошибка', 'Введите заголовок');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        date: date.trim(),
        time: time.trim()
      };

      if (isClient) {
        updateData.clientName = clientName.trim();
        updateData.clientPhone = phone.trim();
        updateData.clientPhoneNormalized = phone.replace(/[^0-9]/g, '');
        updateData.service = service.trim();
        updateData.price = parseInt(price, 10) || 0;
        updateData.comment = comment.trim();
      } else if (isPersonal) {
        updateData.title = title.trim();
        updateData.description = description.trim();
      } else if (isBreak) {
        updateData.description = description.trim();
        updateData.duration = parseInt(duration, 10) || 30;
      }

      await updateDoc(doc(db, 'appointments', appointment.id), updateData);
      Alert.alert('Успех', 'Запись обновлена');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить');
    } finally {
      setSaving(false);
    }
  };

  const deleteAppointment = () => {
    Alert.alert('Удалить запись?', '', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        await deleteDoc(doc(db, 'appointments', appointment.id));
        navigation.goBack();
      }}
    ]);
  };

  const callClient = () => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Ошибка', 'Не удалось позвонить');
    });
  };

  const messageClient = () => {
    if (!phone) return;
    
    Alert.alert(
      '📱 Написать',
      'Выберите способ',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: '💬 WhatsApp', 
          onPress: async () => {
            const cleanPhone = phone.replace(/[^0-9]/g, '');
            const url = `whatsapp://send?phone=${cleanPhone}`;
            const supported = await Linking.canOpenURL(url);
            if (supported) {
              await Linking.openURL(url);
            } else {
              Alert.alert('Ошибка', 'WhatsApp не установлен');
            }
          }
        },
        { 
          text: '📱 SMS', 
          onPress: async () => {
            const isAvailable = await SMS.isAvailableAsync();
            if (isAvailable) {
              await SMS.sendSMSAsync([phone], '');
            } else {
              Alert.alert('Ошибка', 'SMS недоступны');
            }
          }
        }
      ]
    );
  };

  const sendReminder = () => {
    if (!isClient) return;
    
    const message = formatTemplate(REMINDER_TEMPLATES.day_before, {
      clientName,
      service,
      date: formatDate(date),
      time,
      price
    });
    
    Alert.alert(
      '📱 Отправить напоминание',
      'Выберите способ',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: '📱 SMS', 
          onPress: async () => {
            const isAvailable = await SMS.isAvailableAsync();
            if (isAvailable) {
              await SMS.sendSMSAsync([phone], message);
              await updateDoc(doc(db, 'appointments', appointment.id), {
                reminderSent: true,
                reminderSentAt: new Date()
              });
            }
          }
        },
        { 
          text: '💬 WhatsApp', 
          onPress: async () => {
            const cleanPhone = phone.replace(/[^0-9]/g, '');
            const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
            const supported = await Linking.canOpenURL(url);
            if (supported) {
              await Linking.openURL(url);
              await updateDoc(doc(db, 'appointments', appointment.id), {
                reminderSent: true,
                reminderSentAt: new Date()
              });
            }
          }
        }
      ]
    );
  };

  const getHeaderColor = () => {
    if (isClient) return COLORS.danger;
    if (isPersonal) return COLORS.success;
    return COLORS.warning;
  };

  return (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
      <SafeAreaView>
        <View style={[styles.header, { backgroundColor: getHeaderColor() + '15' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.backButton, { color: getHeaderColor() }]}>← Назад</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isClient ? 'Редактировать' : (isPersonal ? 'Личная запись' : 'Перерыв')}
          </Text>
          <View style={styles.headerActions}>
            {isClient && (
              <>
                <TouchableOpacity onPress={callClient} style={styles.headerActionButton}>
                  <Text style={styles.headerActionIcon}>📞</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={messageClient} style={styles.headerActionButton}>
                  <Text style={styles.headerActionIcon}>💬</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity onPress={deleteAppointment}>
              <Text style={[styles.deleteButton, { color: getHeaderColor() }]}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formCard}>
          {isClient ? (
            <>
              <Text style={styles.label}>👤 Имя</Text>
              <TextInput style={styles.input} value={clientName} onChangeText={setClientName} placeholderTextColor={COLORS.textLight} />
              <Text style={styles.label}>📞 Телефон</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={COLORS.textLight} />
              <Text style={styles.label}>💆‍♀️ Услуга</Text>
              <TextInput style={styles.input} value={service} onChangeText={setService} placeholderTextColor={COLORS.textLight} />
            </>
          ) : isPersonal ? (
            <>
              <Text style={styles.label}>📝 Заголовок</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor={COLORS.textLight} />
              <Text style={styles.label}>📄 Описание</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                value={description} 
                onChangeText={setDescription} 
                multiline
                numberOfLines={4}
                placeholderTextColor={COLORS.textLight}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>⏱ Длительность (минут)</Text>
              <TextInput 
                style={styles.input} 
                value={duration} 
                onChangeText={setDuration} 
                keyboardType="numeric"
                placeholderTextColor={COLORS.textLight}
              />
              <Text style={styles.label}>📄 Примечание</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                value={description} 
                onChangeText={setDescription} 
                multiline
                numberOfLines={2}
                placeholderTextColor={COLORS.textLight}
              />
            </>
          )}

          <Text style={styles.label}>📅 Дата</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(!showCalendar)}>
            <Text style={styles.dateButtonText}>{date ? formatDate(date) : 'Выберите дату'}</Text>
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>
          {showCalendar && (
            <Calendar
              onDayPress={(day) => { setDate(day.dateString); setShowCalendar(false); }}
              markedDates={{ [date]: { selected: true, selectedColor: getHeaderColor() } }}
              theme={{ 
                selectedDayBackgroundColor: getHeaderColor(), 
                todayTextColor: getHeaderColor(), 
                arrowColor: getHeaderColor() 
              }}
              style={styles.inlineCalendar}
            />
          )}

          <Text style={styles.label}>⏰ Время</Text>
          <TimeSelector value={time} onSelect={setTime} />

          {isClient && (
            <>
              <Text style={styles.label}>💰 Стоимость</Text>
              <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholderTextColor={COLORS.textLight} />
              <Text style={styles.label}>💬 Комментарий</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                value={comment} 
                onChangeText={setComment} 
                multiline
                numberOfLines={3}
                placeholderTextColor={COLORS.textLight}
              />
            </>
          )}

          {isClient && (
            <TouchableOpacity style={[styles.remindButton, { backgroundColor: getHeaderColor() }]} onPress={sendReminder}>
              <Text style={styles.remindButtonText}>📱 Отправить напоминание</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: getHeaderColor() }, saving && styles.saveButtonDisabled]} 
            onPress={update} 
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Сохранение...' : '💾 Сохранить'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

// ========== СТИЛИ ==========
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: COLORS.headerBg,
    borderBottomWidth: 0,
  },
  logoImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginLeft: 0,
    marginTop: 0,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  headerButtonWrapper: { marginLeft: 15 },
  headerButton: { fontSize: 24, color: '#FFFFFF' },
  headerButtonInactive: { opacity: 0.6 },
  backButton: { fontSize: 16, color: '#FFFFFF', fontWeight: '500' },
  deleteButton: { fontSize: 20 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerActionButton: { padding: 8, marginRight: 5 },
  headerActionIcon: { fontSize: 22 },
  
  remindersContainer: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 15,
    padding: 15,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  remindersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  remindersTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  remindersCount: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },
  reminderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  reminderInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  reminderTime: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary, width: 50 },
  reminderDetails: { flex: 1, marginLeft: 10 },
  reminderClient: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  reminderService: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  reminderActions: { marginLeft: 10 },
  sendReminderButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sendReminderText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  reminderSentBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  reminderSentText: { color: COLORS.success, fontSize: 12, fontWeight: '500' },
  
  earningsBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 15, 
    backgroundColor: COLORS.cardBg, 
    marginHorizontal: 15, 
    marginBottom: 10, 
    borderRadius: 15,
  },
  earningsText: { fontSize: 16, fontWeight: 'bold', color: COLORS.success },
  appointmentsCount: { fontSize: 16, color: COLORS.textSecondary },
  loader: { marginTop: 50 },
  card: { 
    marginHorizontal: 15, 
    marginBottom: 10, 
    borderRadius: 15,
  },
  cardContentTouchable: { flex: 1 },
  cardContent: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  timeContainer: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 15 },
  time: { fontWeight: 'bold', fontSize: 14 },
  infoContainer: { flex: 1 },
  cardClient: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  cardPhone: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  cardService: { fontSize: 14, color: COLORS.textSecondary, marginTop: 5 },
  cardComment: { fontSize: 13, color: COLORS.textLight, marginTop: 3, fontStyle: 'italic' },
  cardPrice: { fontSize: 16, fontWeight: 'bold', color: COLORS.success, marginTop: 5 },
  chevron: { fontSize: 20, color: COLORS.textLight },
  cardQuickActions: { borderTopWidth: 1, borderTopColor: COLORS.border, padding: 10, flexDirection: 'row', justifyContent: 'flex-end' },
  quickCallButton: { backgroundColor: COLORS.infoLight, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  quickCallText: { color: COLORS.info, fontSize: 14, fontWeight: '500' },
  fab: { 
    position: 'absolute', 
    bottom: 25, 
    right: 20, 
    backgroundColor: COLORS.primary, 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 5,
  },
  fabText: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 60, marginBottom: 15, opacity: 0.5 },
  emptyText: { textAlign: 'center', color: COLORS.textLight, fontSize: 16 },
  formContainer: { flex: 1, backgroundColor: COLORS.background },
  formCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 30,
    paddingVertical: 20,
    borderRadius: 20,
  },
  label: { marginHorizontal: 20, marginBottom: 5, marginTop: 10, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  input: { 
    backgroundColor: COLORS.background, 
    marginHorizontal: 20, 
    marginBottom: 10, 
    padding: 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  dateButton: { 
    backgroundColor: COLORS.background, 
    marginHorizontal: 20, 
    marginBottom: 10, 
    padding: 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  dateButtonText: { fontSize: 16, color: COLORS.textPrimary },
  calendarIcon: { fontSize: 20 },
  inlineCalendar: { marginHorizontal: 20, marginBottom: 10, borderRadius: 15 },
  
  timeSelector: {
    backgroundColor: COLORS.background,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeSelectorText: { fontSize: 16, color: COLORS.textPrimary },
  
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  modalOverlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  modalContent: { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 25, borderTopRightRadius: 25, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  closeButton: { fontSize: 22, color: COLORS.textLight },
  
  timePickerContent: { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingBottom: 20 },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  pickerWrapper: {
    height: 180,
    justifyContent: 'center',
  },
  picker: {
    width: 120,
    height: 180,
  },
  pickerItem: {
    fontSize: 22,
    fontWeight: '500',
  },
  timePickerFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 15, 
    borderTopWidth: 1, 
    borderTopColor: COLORS.border 
  },
  selectedTimePreview: { fontSize: 26, fontWeight: 'bold', color: COLORS.primary },
  confirmButton: { backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  saveButton: { marginHorizontal: 20, marginTop: 20, marginBottom: 10, padding: 16, borderRadius: 15, alignItems: 'center' },
  saveButtonDisabled: { backgroundColor: COLORS.textLight },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  remindButton: { marginHorizontal: 20, marginTop: 10, padding: 14, borderRadius: 15, alignItems: 'center' },
  remindButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.cardBg, 
    marginHorizontal: 15, 
    marginVertical: 10, 
    paddingHorizontal: 15, 
    borderRadius: 15, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  searchIcon: { fontSize: 18, marginRight: 10, color: COLORS.textLight },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: COLORS.textPrimary },
  clearText: { fontSize: 18, color: COLORS.textLight, padding: 5 },
  contextMenuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  contextMenu: { backgroundColor: COLORS.cardBg, borderRadius: 15, padding: 10, width: 260 },
  contextMenuItem: { paddingVertical: 14, paddingHorizontal: 20 },
  contextMenuText: { fontSize: 16, color: COLORS.textPrimary },
  contextMenuDelete: { color: COLORS.danger },
  weekCalendarContainer: { 
    backgroundColor: COLORS.calendarBg, 
    paddingVertical: 15, 
    marginHorizontal: 15, 
    marginBottom: 10, 
    borderRadius: 20,
  },
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
  selectedDateHeader: { paddingHorizontal: 20, marginBottom: 8 },
  selectedDateText: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  monthModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  monthModalContent: { backgroundColor: COLORS.cardBg, borderRadius: 25, padding: 20, width: '92%' },
  closeMonthButton: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 15, alignItems: 'center', marginTop: 15 },
  closeMonthButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  statsGrid: { padding: 15 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: { borderRadius: 18, padding: 18, alignItems: 'center', marginBottom: 12 },
  statCardHalf: { flex: 1, marginHorizontal: 5 },
  statIcon: { fontSize: 32, marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 13, color: COLORS.textSecondary, marginTop: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 15, marginHorizontal: 15 },
  topClientsSection: { paddingHorizontal: 15, paddingBottom: 25 },
  topClientCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 10 },
  topClientRank: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  topClientRankText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  topClientInfo: { flex: 1 },
  topClientName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  topClientPhone: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  topClientStats: { alignItems: 'flex-end' },
  topClientSpent: { fontSize: 16, fontWeight: 'bold', color: COLORS.success },
  topClientVisits: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  filterContainer: { paddingHorizontal: 15, marginBottom: 10 },
  filterButton: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 25, backgroundColor: COLORS.cardBg, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  filterButtonText: { fontSize: 14, color: COLORS.textSecondary },
  filterButtonTextActive: { color: '#fff', fontWeight: '500' },
  recordsStats: { paddingHorizontal: 15, marginBottom: 10 },
  recordsStatsText: { fontSize: 14, color: COLORS.textSecondary },
  recordCard: { marginHorizontal: 15, marginBottom: 10, borderRadius: 15, borderLeftWidth: 5, overflow: 'hidden' },
  recordCardHeader: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  recordIconContainer: { width: 45, height: 45, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recordIcon: { fontSize: 22 },
  recordInfo: { flex: 1 },
  recordTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  recordSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  recordDate: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  recordCallButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  recordCallIcon: { fontSize: 20 },
  recordFooter: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingHorizontal: 15, paddingVertical: 10, alignItems: 'flex-end' },
  recordPrice: { fontSize: 16, fontWeight: 'bold' },
});

// ========== ЭКСПОРТ ПРИЛОЖЕНИЯ ==========
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Calendar" component={CalendarScreen} />
        <Stack.Screen name="Stats" component={StatsScreen} />
        <Stack.Screen name="AllRecords" component={AllRecordsScreen} />
        <Stack.Screen name="NewAppointment" component={NewAppointmentScreen} />
        <Stack.Screen name="NewPersonalNote" component={NewPersonalNoteScreen} />
        <Stack.Screen name="NewBreak" component={NewBreakScreen} />
        <Stack.Screen name="EditAppointment" component={EditAppointmentScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}