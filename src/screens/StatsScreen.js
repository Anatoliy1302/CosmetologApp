import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { COLORS, getClientColor } from '../config/colors';
import { formatDate } from '../config/constants';
import { loadFromStorage } from '../config/storage';

export const StatsScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalEarnings: 0, monthEarnings: 0, weekEarnings: 0,
    totalClients: 0, totalAppointments: 0, averageCheck: 0,
    popularService: '', topClients: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const appointments = await loadFromStorage();
      const clientApps = appointments.filter(app => app.type === 'client' || !app.type);
      const totalEarnings = clientApps.reduce((sum, app) => sum + (app.price || 0), 0);
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const monthApps = clientApps.filter(app => app.date?.startsWith(currentMonth));
      const monthEarnings = monthApps.reduce((sum, app) => sum + (app.price || 0), 0);
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      const weekApps = clientApps.filter(app => {
        if (!app.date) return false;
        const appDate = new Date(app.date);
        return appDate >= weekStart && appDate <= weekEnd;
      });
      const weekEarnings = weekApps.reduce((sum, app) => sum + (app.price || 0), 0);
      const clientsMap = new Map();
      clientApps.forEach(app => {
        if (app.clientPhoneNormalized) {
          clientsMap.set(app.clientPhoneNormalized, {
            name: app.clientName, phone: app.clientPhone,
            visits: (clientsMap.get(app.clientPhoneNormalized)?.visits || 0) + 1,
            totalSpent: (clientsMap.get(app.clientPhoneNormalized)?.totalSpent || 0) + (app.price || 0)
          });
        }
      });
      const totalClients = clientsMap.size;
      const averageCheck = clientApps.length > 0 ? Math.round(totalEarnings / clientApps.length) : 0;
      const serviceMap = new Map();
      clientApps.forEach(app => { if (app.service) serviceMap.set(app.service, (serviceMap.get(app.service) || 0) + 1); });
      let popularService = '', maxCount = 0;
      serviceMap.forEach((count, service) => { if (count > maxCount) { maxCount = count; popularService = service; } });
      const topClients = Array.from(clientsMap.values()).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
      setStats({ totalEarnings, monthEarnings, weekEarnings, totalClients, totalAppointments: clientApps.length, averageCheck, popularService, topClients });
    } catch (error) { console.error('Error loading stats:', error); } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backButton}>← Назад</Text></TouchableOpacity><Text style={styles.headerTitle}>Статистика</Text><View style={{ width: 60 }} /></View>
      {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} /> : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: COLORS.primaryLight }]}><Text style={styles.statIcon}>💰</Text><Text style={[styles.statValue, { color: COLORS.primaryDark }]}>{stats.totalEarnings} ₽</Text><Text style={styles.statLabel}>Общая выручка</Text></View>
            <View style={styles.statRow}>
              <View style={[styles.statCard, styles.statCardHalf, { backgroundColor: COLORS.infoLight }]}><Text style={styles.statIcon}>📅</Text><Text style={[styles.statValue, { color: COLORS.info }]}>{stats.monthEarnings} ₽</Text><Text style={styles.statLabel}>За месяц</Text></View>
              <View style={[styles.statCard, styles.statCardHalf, { backgroundColor: COLORS.successLight }]}><Text style={styles.statIcon}>📆</Text><Text style={[styles.statValue, { color: COLORS.success }]}>{stats.weekEarnings} ₽</Text><Text style={styles.statLabel}>За неделю</Text></View>
            </View>
            <View style={styles.statRow}>
              <View style={[styles.statCard, styles.statCardHalf, { backgroundColor: COLORS.warningLight }]}><Text style={styles.statIcon}>👥</Text><Text style={[styles.statValue, { color: COLORS.warning }]}>{stats.totalClients}</Text><Text style={styles.statLabel}>Клиентов</Text></View>
              <View style={[styles.statCard, styles.statCardHalf, { backgroundColor: COLORS.dangerLight }]}><Text style={styles.statIcon}>📋</Text><Text style={[styles.statValue, { color: COLORS.danger }]}>{stats.totalAppointments}</Text><Text style={styles.statLabel}>Записей</Text></View>
            </View>
            <View style={[styles.statCard, { backgroundColor: COLORS.secondary }]}><Text style={styles.statIcon}>💳</Text><Text style={[styles.statValue, { color: COLORS.primary }]}>{stats.averageCheck} ₽</Text><Text style={styles.statLabel}>Средний чек</Text></View>
            {stats.popularService && <View style={[styles.statCard, { backgroundColor: '#F5EEF8' }]}><Text style={styles.statIcon}>⭐</Text><Text style={[styles.statValue, { color: COLORS.primaryDark }]}>{stats.popularService}</Text><Text style={styles.statLabel}>Популярная услуга</Text></View>}
          </View>
          {stats.topClients.length > 0 && (
            <View style={styles.topClientsSection}>
              <Text style={styles.sectionTitle}>🏆 Топ клиентов</Text>
              {stats.topClients.map((client, index) => (
                <View key={index} style={[styles.topClientCard, { backgroundColor: getClientColor(client.phone) }]}>
                  <View style={[styles.topClientRank, { backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : COLORS.primary }]}><Text style={styles.topClientRankText}>{index + 1}</Text></View>
                  <View style={styles.topClientInfo}><Text style={styles.topClientName}>{client.name}</Text><Text style={styles.topClientPhone}>{client.phone}</Text></View>
                  <View style={styles.topClientStats}><Text style={styles.topClientSpent}>{client.totalSpent} ₽</Text><Text style={styles.topClientVisits}>{client.visits} визитов</Text></View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: COLORS.headerBg },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  backButton: { fontSize: 16, color: '#FFFFFF', fontWeight: '500' },
  loader: { marginTop: 50 },
  statsGrid: { padding: 15 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: { borderRadius: 18, padding: 18, alignItems: 'center', marginBottom: 12 },
  statCardHalf: { flex: 1, marginHorizontal: 5 },
  statIcon: { fontSize: 32, marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 13, color: COLORS.textSecondary, marginTop: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 15, marginHorizontal: 15 },
  topClientsSection: { paddingHorizontal: 15, paddingBottom: 25 },
  topClientCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 10 },
  topClientRank: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  topClientRankText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  topClientInfo: { flex: 1 },
  topClientName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  topClientPhone: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  topClientStats: { alignItems: 'flex-end' },
  topClientSpent: { fontSize: 16, fontWeight: 'bold', color: COLORS.success },
  topClientVisits: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
});