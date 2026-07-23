export const COLORS = {
  primary: '#9B59B6',
  primaryLight: '#D2B4DE',
  primaryDark: '#7D3C98',
  secondary: '#E8DAEF',
  success: '#27AE60',
  successLight: '#D5F5E3',
  warning: '#F39C12',
  warningLight: '#FDEBD0',
  danger: '#E74C3C',
  dangerLight: '#FADBD8',
  info: '#3498DB',
  infoLight: '#D6EAF8',
  background: '#F4F6F9',
  cardBg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF0F4',
  inputBg: '#FFFFFF',
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  textLight: '#95A5A6',
  textOnPrimary: '#FFFFFF',
  border: '#E0E0E0',
  shadow: '#000000',
  calendarBg: '#2C2C2E',
  calendarDarkBg: '#1C1C1E',
  calendarDarkSurface: '#2C2C2E',
  calendarDarkText: '#FFFFFF',
  calendarDarkTextMuted: '#AAAAAA',
  headerBg: '#9B59B6',
  overlay: 'rgba(0,0,0,0.45)',
  fab: '#9B59B6',
};

export const APPOINTMENT = {
  client: { bg: '#FFF5F5', border: '#E74C3C', accent: '#E74C3C', timeBg: '#E74C3C20' },
  personal: { bg: '#F0FFF4', border: '#27AE60', accent: '#27AE60', timeBg: '#27AE6020' },
  break: { bg: '#FFFBF0', border: '#F39C12', accent: '#F39C12', timeBg: '#F39C1220' },
  cancelled: { opacity: 0.55, border: '#BDC3C7', accent: '#95A5A6' },
};

export const CALENDAR_THEME = {
  backgroundColor: '#FFFFFF',
  calendarBackground: '#FFFFFF',
  selectedDayBackgroundColor: COLORS.primary,
  todayTextColor: COLORS.primary,
  arrowColor: COLORS.primary,
  monthTextColor: COLORS.textPrimary,
  textMonthFontWeight: 'bold',
  textDayFontSize: 15,
  textMonthFontSize: 16,
  dayTextColor: COLORS.textPrimary,
  textDisabledColor: '#CCCCCC',
  textSectionTitleColor: COLORS.primary,
};

export const DARK_CALENDAR_THEME = {
  backgroundColor: COLORS.calendarDarkBg,
  calendarBackground: COLORS.calendarDarkBg,
  selectedDayBackgroundColor: COLORS.primary,
  todayTextColor: COLORS.primary,
  arrowColor: COLORS.primary,
  monthTextColor: COLORS.calendarDarkText,
  textMonthFontWeight: 'bold',
  textDayFontSize: 15,
  textMonthFontSize: 16,
  dayTextColor: COLORS.calendarDarkText,
  textDisabledColor: '#555555',
  textSectionTitleColor: COLORS.primary,
};

export const CLIENT_COLORS = [
  '#FFE4E1', '#E8F8F5', '#FEF9E7', '#F4ECF7', '#E8DAEF',
  '#D6EAF8', '#FDEDEC', '#E8F6F3', '#FEF5E7', '#F5EEF8',
];

export const getClientColor = (phone) => {
  if (!phone) return CLIENT_COLORS[0];
  const sum = phone.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CLIENT_COLORS[sum % CLIENT_COLORS.length];
};

export const getAppointmentStyle = (type, isCancelled = false) => {
  if (isCancelled) return { ...APPOINTMENT.client, ...APPOINTMENT.cancelled };
  if (type === 'personal') return APPOINTMENT.personal;
  if (type === 'break') return APPOINTMENT.break;
  return APPOINTMENT.client;
};
