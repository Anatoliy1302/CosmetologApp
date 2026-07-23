import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { AllRecordsScreen } from './src/screens/AllRecordsScreen';
import { ClientCardScreen } from './src/screens/ClientCardScreen';
import { NewAppointmentScreen } from './src/screens/NewAppointmentScreen';
import { NewNoteScreen } from './src/screens/NewNoteScreen';
import { EditAppointmentScreen } from './src/screens/EditAppointmentScreen';
import { NotifyCityScreen } from './src/screens/NotifyCityScreen';
import { TemplatesScreen } from './src/screens/TemplatesScreen';
import { API_URL, API_KEY, isApiConfigured } from './src/config/api';
import { STORAGE_KEY } from './src/services/storage/keys';

const Stack = createStackNavigator();

const MIGRATION_FLAG_KEY = '@migration_completed';

const loadLegacyAppointments = async () => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const runMigrationIfNeeded = async () => {
  try {
    const completed = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
    if (completed === 'true') return;

    if (!isApiConfigured()) return;

    const appointments = await loadLegacyAppointments();
    const response = await fetch(`${API_URL}/api/migrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ appointments }),
    });

    if (!response.ok) {
      console.warn('Миграция не удалась:', response.status);
      return;
    }

    await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
  } catch (error) {
    console.warn('Миграция не удалась:', error?.message || error);
  }
};

export default function App() {
  useEffect(() => {
    runMigrationIfNeeded();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Calendar" component={CalendarScreen} />
            <Stack.Screen name="Stats" component={StatsScreen} />
            <Stack.Screen name="AllRecords" component={AllRecordsScreen} />
            <Stack.Screen name="ClientCard" component={ClientCardScreen} />
            <Stack.Screen name="NewAppointment" component={NewAppointmentScreen} />
            <Stack.Screen name="NewNote" component={NewNoteScreen} />
            <Stack.Screen name="EditAppointment" component={EditAppointmentScreen} />
            <Stack.Screen name="NotifyCity" component={NotifyCityScreen} />
            <Stack.Screen name="Templates" component={TemplatesScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
