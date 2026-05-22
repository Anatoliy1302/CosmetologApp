export const CITIES = ['Владивосток', 'Кавалерово'];

export const HOURS = Array.from({ length: 15 }, (_, i) => String(i + 8).padStart(2, '0'));
export const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

export const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
export const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

// Функция для получения адреса по городу
export const getAddressByCity = (city) => {
  switch (city) {
    case 'Владивосток':
      return 'Владивосток, ул. Некрасовская 48А';
    case 'Кавалерово':
      return 'Кавалерово, ул. Чехова 6А';
    default:
      return city || '';
  }
};

export const REMINDER_TEMPLATES = {
  day_before: '{client_name}, напоминаем о завтрашней записи!\n\nУслуга: {service}\nДата: {date}\nВремя: {time}\nАдрес: {address}\n\n📍 Ждём вас!\n\nКосметолог Альбина',
  confirmation: '{client_name}, вы записаны!\n\nУслуга: {service}\nДата: {date}\nВремя: {time}\nАдрес: {address}\n\n📍 Ждём вас!\n\nКосметолог Альбина'
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
};

export const formatShortDate = (dateString) => {
  if (!dateString) return 'Нет';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Нет';
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
};

export const formatTemplate = (template, data) => {
  return template
    .replace(/{client_name}/g, data.clientName || '')
    .replace(/{service}/g, data.service || '')
    .replace(/{date}/g, data.date || '')
    .replace(/{time}/g, data.time || '')
    .replace(/{price}/g, data.price || '0')
    .replace(/{address}/g, data.address || '');
};

export const normalizePhone = (phone) => (phone || '').replace(/[^0-9]/g, '');