import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../config/colors';

export const PrimaryButton = ({ title, onPress, disabled, color, style }) => (
  <TouchableOpacity
    style={[styles.btn, color ? { backgroundColor: color } : null, disabled && styles.disabled, style]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={styles.text}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  btn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  disabled: { opacity: 0.6 },
  text: { color: COLORS.textOnPrimary, fontSize: 17, fontWeight: '700' },
});
