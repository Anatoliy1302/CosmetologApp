import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../config/colors';

export const DayStatsBar = ({ earnings, clientCount, personalCount }) => (
  <View style={styles.statsBar}>
    <Text style={styles.statValue}>💰 {earnings} ₽</Text>
    <Text style={styles.statValue}>👤 {clientCount}</Text>
    <Text style={styles.statValue}>📝 {personalCount}</Text>
  </View>
);

const styles = StyleSheet.create({
  statsBar: {
    flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10,
    backgroundColor: COLORS.cardBg, marginHorizontal: 10, marginTop: 8,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  statValue: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
});
