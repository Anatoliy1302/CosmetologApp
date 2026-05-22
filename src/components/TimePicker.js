import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { COLORS } from '../config/colors';
import { HOURS, MINUTES } from '../config/constants';

export const TimePickerModal = ({ visible, onClose, onSelect, initialTime }) => {
  const initialHour = initialTime ? initialTime.split(':')[0] : '09';
  const initialMinute = initialTime ? initialTime.split(':')[1] : '00';
  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.timePickerContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Выберите время</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.closeButton}>✕</Text></TouchableOpacity>
          </View>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Часы</Text>
              <View style={styles.pickerWrapper}>
                <Picker selectedValue={selectedHour} style={styles.picker} onValueChange={setSelectedHour}>
                  {HOURS.map(hour => <Picker.Item key={hour} label={hour} value={hour} color={COLORS.textPrimary} />)}
                </Picker>
              </View>
            </View>
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Минуты</Text>
              <View style={styles.pickerWrapper}>
                <Picker selectedValue={selectedMinute} style={styles.picker} onValueChange={setSelectedMinute}>
                  {MINUTES.map(minute => <Picker.Item key={minute} label={minute} value={minute} color={COLORS.textPrimary} />)}
                </Picker>
              </View>
            </View>
          </View>
          <View style={styles.timePickerFooter}>
            <Text style={styles.selectedTimePreview}>{selectedHour}:{selectedMinute}</Text>
            <TouchableOpacity style={styles.confirmButton} onPress={() => { onSelect(`${selectedHour}:${selectedMinute}`); onClose(); }}>
              <Text style={styles.confirmButtonText}>Подтвердить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const TimeSelector = ({ value, onSelect }) => {
  const [showPicker, setShowPicker] = useState(false);
  return (
    <>
      <TouchableOpacity style={styles.timeSelector} onPress={() => setShowPicker(true)}>
        <Text style={[styles.timeSelectorText, !value && { color: COLORS.textLight }]}>{value || 'Выберите время'}</Text>
      </TouchableOpacity>
      <TimePickerModal visible={showPicker} onClose={() => setShowPicker(false)} onSelect={(t) => { onSelect(t); setShowPicker(false); }} initialTime={value} />
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  timePickerContent: { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  closeButton: { fontSize: 22, color: COLORS.textLight },
  pickerContainer: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  pickerColumn: { flex: 1, alignItems: 'center' },
  pickerLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  pickerWrapper: { height: 180, justifyContent: 'center' },
  picker: { width: 120, height: 180 },
  selectedTimePreview: { fontSize: 26, fontWeight: 'bold', color: COLORS.primary },
  confirmButton: { backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  timePickerFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: COLORS.border },
  timeSelector: { backgroundColor: COLORS.background, marginHorizontal: 20, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  timeSelectorText: { fontSize: 16, color: COLORS.textPrimary },
});