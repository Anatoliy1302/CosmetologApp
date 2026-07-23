import React from 'react';
import { Modal, TouchableOpacity, View, Text, Alert, StyleSheet, Linking } from 'react-native';
import { isClientAppointment } from '../../config/storage';
import { COLORS } from '../../config/colors';

export const AppointmentContextMenu = ({
  visible,
  appointment,
  onClose,
  onEdit,
  onRemind,
  onDelete,
}) => (
  <Modal visible={visible} transparent animationType="fade">
    <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
      <View style={styles.menu}>
        <TouchableOpacity style={styles.item} onPress={onEdit}>
          <Text style={styles.text}>✏️ Редактировать</Text>
        </TouchableOpacity>
        {appointment?.clientPhone && (
          <TouchableOpacity style={styles.item} onPress={() => { onClose(); Linking.openURL(`tel:${appointment.clientPhone}`); }}>
            <Text style={styles.text}>📞 Позвонить</Text>
          </TouchableOpacity>
        )}
        {isClientAppointment(appointment) && appointment?.status !== 'cancelled' && (
          <TouchableOpacity style={styles.item} onPress={() => { onClose(); onRemind(appointment); }}>
            <Text style={styles.text}>📱 Напомнить</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.item} onPress={() => {
          Alert.alert('Удалить?', '', [
            { text: 'Нет' },
            { text: 'Да', style: 'destructive', onPress: () => { onClose(); onDelete(appointment); } },
          ]);
        }}>
          <Text style={[styles.text, styles.delete]}>🗑️ Удалить</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', alignItems: 'center' },
  menu: { backgroundColor: COLORS.cardBg, borderRadius: 15, padding: 10, width: 260, borderWidth: 1, borderColor: COLORS.border },
  item: { paddingVertical: 14, paddingHorizontal: 20 },
  text: { fontSize: 16, color: COLORS.textPrimary },
  delete: { color: COLORS.danger },
});
