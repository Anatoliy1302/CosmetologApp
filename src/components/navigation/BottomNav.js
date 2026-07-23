import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../config/colors';

const NAV_ITEMS = [
  { key: 'month', icon: '📅', label: 'Месяц', color: COLORS.secondary },
  { key: 'stats', icon: '📊', label: 'Статистика', color: COLORS.infoLight },
  { key: 'records', icon: '📋', label: 'Записи', color: COLORS.successLight },
  { key: 'notify', icon: '📢', label: 'Рассылка', color: COLORS.warningLight },
];

export const BottomNav = ({ onPress }) => (
  <View style={styles.bottomNav}>
    {NAV_ITEMS.map((item) => (
      <TouchableOpacity key={item.key} style={styles.navItem} onPress={() => onPress(item.key)}>
        <View style={[styles.navIconBox, { backgroundColor: item.color }]}>
          <Text style={styles.navIcon3D}>{item.icon}</Text>
        </View>
        <Text style={styles.navLabel}>{item.label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 12, paddingBottom: 28,
    backgroundColor: COLORS.cardBg, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  navItem: { alignItems: 'center', padding: 5, minWidth: 70 },
  navIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 4, elevation: 6 },
  navIcon3D: { fontSize: 26 },
  navLabel: { fontSize: 10, color: COLORS.primary, fontWeight: '700', marginTop: 2 },
});
