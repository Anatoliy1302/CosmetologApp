import React from 'react';
import { Modal, TouchableOpacity, View, Text } from 'react-native';
import { CITIES } from '../../config/constants';
import { commonStyles } from '../../theme/commonStyles';

export const CityPickerModal = ({ visible, selectedCity, onSelect, onClose }) => (
  <Modal visible={visible} transparent animationType="fade">
    <TouchableOpacity style={commonStyles.modalOverlay} activeOpacity={1} onPress={onClose}>
      <View style={commonStyles.contextMenu}>
        {CITIES.map((city) => (
          <TouchableOpacity
            key={city}
            style={commonStyles.contextMenuItem}
            onPress={() => { onSelect(city); onClose(); }}
          >
            <Text style={[commonStyles.contextMenuText, selectedCity === city && commonStyles.contextMenuTextActive]}>
              {city} {selectedCity === city ? '✓' : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </TouchableOpacity>
  </Modal>
);
