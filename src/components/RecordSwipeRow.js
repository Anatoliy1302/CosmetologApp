import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder,
} from 'react-native';
import { formatShortDate, normalizePhone } from '../config/constants';
import { isClientAppointment } from '../config/storage';
import { COLORS, getClientColor } from '../config/colors';

const getRecordIcon = (r) => {
  const t = r.type || 'client';
  if (t === 'client') return '👤';
  if (t === 'personal') return '📝';
  return '☕';
};

const getRecordTitle = (r) => {
  const t = r.type || 'client';
  if (t === 'client') {
    return r.clientSurname ? `${r.clientName || ''} ${r.clientSurname}` : (r.clientName || 'Без имени');
  }
  if (t === 'personal') return r.title || 'Личная запись';
  return 'Перерыв';
};

const getRecordSubtitle = (r) => {
  const t = r.type || 'client';
  if (t === 'client') return `${r.service || ''} • ${r.clientPhone || ''}`;
  if (t === 'personal') return r.description || '';
  return r.description || `Длительность: ${r.duration || 30} мин`;
};

export const RecordSwipeRow = ({ item, navigation, onDelete, onRefresh, onCall, onSms }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -120));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const toValue = gestureState.dx < -60 ? -120 : 0;
        Animated.spring(translateX, { toValue, useNativeDriver: true }).start();
      },
    })
  ).current;

  const isClient = isClientAppointment(item);
  const bgColor = getClientColor(item.clientPhone);
  const subtitle = getRecordSubtitle(item);

  const handlePress = () => {
    if (isClient && item.clientPhone) {
      navigation.navigate('ClientCard', {
        client: {
          name: item.clientName,
          surname: item.clientSurname,
          phone: item.clientPhoneNormalized || normalizePhone(item.clientPhone || ''),
        },
      });
    } else {
      navigation.navigate('EditAppointment', { appointment: item, onUpdate: onRefresh });
    }
  };

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.deleteActions}>
        <TouchableOpacity style={styles.deleteSwipeBtn} onPress={() => onDelete(item.id)}>
          <Text style={styles.deleteSwipeText}>🗑️</Text>
        </TouchableOpacity>
      </View>
      <Animated.View style={{ flex: 1, transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <TouchableOpacity
          style={[styles.recordCard, { backgroundColor: bgColor, borderLeftColor: isClient ? COLORS.primary : COLORS.warning }]}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <View style={styles.recordCardHeader}>
            <View style={styles.recordIconContainer}>
              <Text style={styles.recordIcon}>{getRecordIcon(item)}</Text>
            </View>
            <View style={styles.recordInfo}>
              <Text style={styles.recordTitle}>{getRecordTitle(item)}</Text>
              {subtitle ? <Text style={styles.recordSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
              <Text style={styles.recordDate}>{formatShortDate(item.date)} в {item.time}</Text>
            </View>
          </View>
          <View style={styles.recordActions}>
            {isClient && item.clientPhone && (
              <>
                <TouchableOpacity style={styles.actionCallBtn} onPress={() => onCall(item.clientPhone)}>
                  <Text style={styles.actionCallIcon}>📞</Text>
                  <Text style={styles.actionCallText}>Звонок</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionSmsBtn} onPress={() => onSms(item.clientPhone)}>
                  <Text style={styles.actionSmsIcon}>💬</Text>
                  <Text style={styles.actionSmsText}>SMS</Text>
                </TouchableOpacity>
              </>
            )}
            {item.price > 0 && <Text style={styles.recordPrice}>{item.price} ₽</Text>}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  swipeContainer: { flexDirection: 'row', alignItems: 'stretch', marginHorizontal: 15, marginBottom: 8 },
  deleteActions: { width: 60, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.danger, borderRadius: 12, marginRight: 5 },
  deleteSwipeBtn: { padding: 10 },
  deleteSwipeText: { fontSize: 24 },
  recordCard: { flex: 1, borderRadius: 12, borderLeftWidth: 3, padding: 14 },
  recordCardHeader: { flexDirection: 'row', alignItems: 'center' },
  recordIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surfaceAlt, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recordIcon: { fontSize: 18 },
  recordInfo: { flex: 1 },
  recordTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  recordSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  recordDate: { fontSize: 11, color: COLORS.textLight, marginTop: 3 },
  recordActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  actionCallBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.success, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionCallIcon: { fontSize: 14, marginRight: 4 },
  actionCallText: { color: COLORS.textOnPrimary, fontSize: 13, fontWeight: '600' },
  actionSmsBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.info, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionSmsIcon: { fontSize: 14, marginRight: 4 },
  actionSmsText: { color: COLORS.textOnPrimary, fontSize: 13, fontWeight: '600' },
  recordPrice: { fontSize: 15, fontWeight: '700', color: COLORS.success },
});
