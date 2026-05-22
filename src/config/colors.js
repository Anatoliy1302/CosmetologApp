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
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  textLight: '#95A5A6',
  border: '#E0E0E0',
  shadow: '#000000',
  calendarBg: '#2C3E50',
  headerBg: '#9B59B6',
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