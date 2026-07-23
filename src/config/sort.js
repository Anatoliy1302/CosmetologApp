import { normalizeDateString } from './constants';

export const parseTimeToMinutes = (time) => {
  if (!time) return 0;
  const parts = time.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

export const compareByDateTime = (a, b) => {
  const dateA = normalizeDateString(a.date);
  const dateB = normalizeDateString(b.date);
  if (dateA !== dateB) return dateA.localeCompare(dateB);
  return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
};

export const sortAppointmentsByDateTime = (list, descending = false) => {
  const sorted = [...list].sort(compareByDateTime);
  return descending ? sorted.reverse() : sorted;
};
