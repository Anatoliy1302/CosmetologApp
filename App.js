import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { AllRecordsScreen } from './src/screens/AllRecordsScreen';
import { ClientCardScreen } from './src/screens/ClientCardScreen';
import { NewAppointmentScreen } from './src/screens/NewAppointmentScreen';
import { NewPersonalNoteScreen } from './src/screens/NewPersonalNoteScreen';
import { NewBreakScreen } from './src/screens/NewBreakScreen';
import { EditAppointmentScreen } from './src/screens/EditAppointmentScreen';
import { NotifyCityScreen } from './src/screens/NotifyCityScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Calendar" component={CalendarScreen} />
        <Stack.Screen name="Stats" component={StatsScreen} />
        <Stack.Screen name="AllRecords" component={AllRecordsScreen} />
        <Stack.Screen name="ClientCard" component={ClientCardScreen} />
        <Stack.Screen name="NewAppointment" component={NewAppointmentScreen} />
        <Stack.Screen name="NewPersonalNote" component={NewPersonalNoteScreen} />
        <Stack.Screen name="NewBreak" component={NewBreakScreen} />
        <Stack.Screen name="EditAppointment" component={EditAppointmentScreen} />
        <Stack.Screen name="NotifyCity" component={NotifyCityScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}