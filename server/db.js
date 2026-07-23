const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'cosmetolog.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS client_info (
    phone TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const getAllAppointments = () => {
  const rows = db.prepare('SELECT data FROM appointments ORDER BY updated_at DESC').all();
  return rows.map((row) => JSON.parse(row.data));
};

const upsertAppointment = (appointment) => {
  const updatedAt = appointment.updatedAt || new Date().toISOString();
  const payload = { ...appointment, updatedAt };
  db.prepare(`
    INSERT INTO appointments (id, data, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `).run(payload.id, JSON.stringify(payload), updatedAt);
  return payload;
};

const deleteAppointment = (id) => {
  db.prepare('DELETE FROM appointments WHERE id = ?').run(id);
};

const syncAppointments = (appointments) => {
  const upsert = db.transaction((items) => {
    for (const item of items) {
      upsertAppointment(item);
    }
  });
  upsert(appointments);
  return getAllAppointments();
};

const getAllClientInfo = () => {
  const rows = db.prepare('SELECT phone, data FROM client_info').all();
  const result = {};
  for (const row of rows) {
    result[row.phone] = JSON.parse(row.data);
  }
  return result;
};

const upsertClientInfo = (phone, info) => {
  const updatedAt = new Date().toISOString();
  const payload = { ...info, updatedAt };
  db.prepare(`
    INSERT INTO client_info (phone, data, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(phone) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `).run(phone, JSON.stringify(payload), updatedAt);
  return payload;
};

module.exports = {
  getAllAppointments,
  upsertAppointment,
  deleteAppointment,
  syncAppointments,
  getAllClientInfo,
  upsertClientInfo,
};
