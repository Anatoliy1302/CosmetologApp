import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, APPOINTMENT } from '../../config/colors';

const OPTIONS = [
  { key: 'client', icon: '👤', title: 'Запись клиента', desc: 'Добавить клиента на процедуру', color: APPOINTMENT.client.accent },
  { key: 'personal', icon: '📝', title: 'Личная запись', desc: 'Заметки, планы, напоминания', color: APPOINTMENT.personal.accent },
  { key: 'break', icon: '☕', title: 'Перерыв', desc: 'Обед, отдых, пауза', color: APPOINTMENT.break.accent },
];

export const NewAppointmentModal = ({ visible, onClose, onSelect }) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.overlay}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Новая запись</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.close}>✕</Text></TouchableOpacity>
        </View>
        {OPTIONS.map((opt) => (
          <TouchableOpacity key={opt.key} style={styles.optionBtn} onPress={() => onSelect(opt.key)}>
            <View style={[styles.optionIcon, { backgroundColor: opt.color }]}><Text style={styles.optionIconText}>{opt.icon}</Text></View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>{opt.title}</Text>
              <Text style={styles.optionDesc}>{opt.desc}</Text>
            </View>
            <Text style={styles.optionArrow}>›</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelText}>Отмена</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  content: { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  close: { fontSize: 24, color: COLORS.textLight, padding: 5 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceAlt, padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  optionIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  optionIconText: { fontSize: 24 },
  optionInfo: { flex: 1 },
  optionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 3 },
  optionDesc: { fontSize: 13, color: COLORS.textSecondary },
  optionArrow: { fontSize: 24, color: COLORS.textLight },
  cancelBtn: { backgroundColor: COLORS.surfaceAlt, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 5 },
  cancelText: { fontSize: 17, fontWeight: '600', color: COLORS.danger },
});
