import React, { memo } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { isClientAppointment } from '../../config/storage';
import { getAppointmentStyle, COLORS } from '../../config/colors';

const AppointmentCardInner = ({ item, onPressItem, onLongPressItem }) => {
  const isClient = isClientAppointment(item);
  const isPersonal = item.type === 'personal';
  const isCancelled = item.status === 'cancelled';
  const type = isPersonal ? 'personal' : (item.type === 'break' ? 'break' : 'client');
  const apptStyle = getAppointmentStyle(type, isCancelled);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: apptStyle.bg, borderLeftColor: apptStyle.border, opacity: apptStyle.opacity || 1 }]}
      onPress={() => onPressItem(item)}
      onLongPress={() => onLongPressItem(item)}
    >
      <View style={styles.cardContent}>
        <View style={[styles.timeContainer, { backgroundColor: apptStyle.timeBg }]}>
          <Text style={[styles.time, { color: apptStyle.accent }]}>{item.time}</Text>
        </View>
        <View style={styles.infoContainer}>
          {isClient ? (
            <>
              <Text style={styles.cardClient}>
                {item.clientSurname ? `${item.clientName} ${item.clientSurname}` : item.clientName}
                {isCancelled ? ' (отменена)' : ''}
              </Text>
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

export const AppointmentCard = memo(AppointmentCardInner, (prev, next) => (
  prev.item.id === next.item.id
  && prev.item.updatedAt === next.item.updatedAt
  && prev.item.status === next.item.status
  && prev.onPressItem === next.onPressItem
  && prev.onLongPressItem === next.onLongPressItem
));

const styles = StyleSheet.create({
  card: { marginHorizontal: 15, marginBottom: 8, borderRadius: 12, borderLeftWidth: 3 },
  cardContent: { flexDirection: 'row', padding: 14, alignItems: 'center' },
  timeContainer: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 15, marginRight: 12 },
  time: { fontWeight: '700', fontSize: 13 },
  infoContainer: { flex: 1 },
  cardClient: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  cardPhone: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  cardService: { fontSize: 13, color: COLORS.textSecondary, marginTop: 3 },
  cardPrice: { fontSize: 14, fontWeight: '700', color: COLORS.success, marginTop: 4 },
  chevron: { fontSize: 18, color: COLORS.textLight },
});
