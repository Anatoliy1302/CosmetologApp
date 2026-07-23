import { toLocalDateString } from '../config/constants';
import { compareByDateTime } from '../config/sort';
import { isClientAppointment } from '../config/storage';

export const filterRecords = (list, { searchText, type, dateF, priceS }) => {
  let filtered = [...list];

  if (type === 'clients') filtered = filtered.filter(isClientAppointment);
  else if (type === 'personal') filtered = filtered.filter((r) => r.type === 'personal');
  else if (type === 'breaks') filtered = filtered.filter((r) => r.type === 'break');

  const today = toLocalDateString();
  if (dateF === 'today') {
    filtered = filtered.filter((r) => r.date === today);
  } else if (dateF === 'week') {
    const ws = new Date();
    ws.setDate(ws.getDate() - ws.getDay() + (ws.getDay() === 0 ? -6 : 1));
    const we = new Date(ws);
    we.setDate(ws.getDate() + 6);
    filtered = filtered.filter(
      (r) => r.date && r.date >= toLocalDateString(ws) && r.date <= toLocalDateString(we)
    );
  } else if (dateF === 'month') {
    const m = today.slice(0, 7);
    filtered = filtered.filter((r) => r.date?.startsWith(m));
  }

  if (searchText.trim()) {
    const q = searchText.toLowerCase();
    filtered = filtered.filter((r) => {
      const name = r.clientName || r.title || '';
      const surname = r.clientSurname || '';
      const fullName = `${name} ${surname}`.toLowerCase();
      const phone = r.clientPhone || '';
      const service = r.service || '';
      return fullName.includes(q) || phone.includes(q) || service.toLowerCase().includes(q);
    });
  }

  if (priceS === 'asc') filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
  else if (priceS === 'desc') filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
  else filtered.sort(compareByDateTime);

  return filtered;
};
