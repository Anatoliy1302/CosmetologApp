import React, { useState } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { formatDate } from '../../config/constants';
import { COLORS, CALENDAR_THEME } from '../../config/colors';
import { commonStyles } from '../../theme/commonStyles';

export const DatePickerField = ({
  label,
  date,
  onChangeDate,
  accentColor = COLORS.primary,
  calendarTheme = CALENDAR_THEME,
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const theme = accentColor !== COLORS.primary
    ? { ...calendarTheme, selectedDayBackgroundColor: accentColor, todayTextColor: accentColor, arrowColor: accentColor }
    : calendarTheme;

  return (
    <View>
      {label ? <Text style={commonStyles.label}>{label}</Text> : null}
      <TouchableOpacity style={commonStyles.pickerBtn} onPress={() => setShowCalendar(!showCalendar)}>
        <Text style={commonStyles.pickerBtnText}>{date ? formatDate(date) : 'Выберите дату'}</Text>
        <Text style={commonStyles.pickerBtnIcon}>📅</Text>
      </TouchableOpacity>
      {showCalendar && (
        <Calendar
          onDayPress={(day) => { onChangeDate(day.dateString); setShowCalendar(false); }}
          markedDates={{ [date]: { selected: true, selectedColor: accentColor } }}
          theme={theme}
          style={{ marginTop: 10, borderRadius: 12 }}
        />
      )}
    </View>
  );
};
