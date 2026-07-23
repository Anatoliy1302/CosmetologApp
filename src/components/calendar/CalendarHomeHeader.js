import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { COLORS } from '../../config/colors';

export const CalendarHomeHeader = ({
  dailyEarnings,
  syncStatus,
  showReminders,
  onToggleReminders,
  onOpenTemplates,
}) => (
  <View style={styles.topBar}>
    <Image source={require('../../../assets/logo.png')} style={styles.logoImage} resizeMode="cover" />
    <View style={styles.center}>
      <Text style={styles.title}>Косметолог Альбина</Text>
      <Text style={styles.subtitle}>{dailyEarnings} ₽ сегодня{syncStatus ? ` • ${syncStatus}` : ''}</Text>
    </View>
    <TouchableOpacity onPress={onToggleReminders} style={styles.btn}>
      <Text style={[styles.btnText, !showReminders && styles.btnInactive]}>🔔</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onOpenTemplates} style={styles.btn}>
      <Text style={styles.btnText}>✉️</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: COLORS.headerBg, borderBottomWidth: 1, borderBottomColor: COLORS.primaryDark },
  logoImage: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: COLORS.textOnPrimary },
  center: { flex: 1, marginLeft: 12 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textOnPrimary },
  subtitle: { fontSize: 12, color: COLORS.secondary, marginTop: 2 },
  btn: { padding: 8 },
  btnText: { fontSize: 22 },
  btnInactive: { opacity: 0.4 },
});
