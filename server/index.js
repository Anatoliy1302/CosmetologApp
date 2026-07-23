require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3847;
const API_KEY = process.env.API_KEY || 'cosmetolog-dev-key';
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const auth = (req, res, next) => {
  const key = req.headers['x-api-key'] || req.headers.authorization?.replace('Bearer ', '');
  if (key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'cosmetolog-api' });
});

app.get('/api/appointments', auth, (_req, res) => {
  res.json({ appointments: db.getAllAppointments() });
});

app.post('/api/appointments/sync', auth, (req, res) => {
  const { appointments } = req.body;
  if (!Array.isArray(appointments)) {
    return res.status(400).json({ error: 'appointments must be an array' });
  }
  const merged = db.syncAppointments(appointments);
  res.json({ appointments: merged });
});

app.post('/api/migrate', auth, (req, res) => {
  const { appointments } = req.body;
  if (!Array.isArray(appointments)) {
    return res.status(400).json({ error: 'appointments must be an array' });
  }
  const merged = db.syncAppointments(appointments);
  res.json({ ok: true, migrated: appointments.length, appointments: merged });
});

app.put('/api/appointments/:id', auth, (req, res) => {
  const { id } = req.params;
  if (!req.body?.id || req.body.id !== id) {
    return res.status(400).json({ error: 'Invalid appointment id' });
  }
  const saved = db.upsertAppointment(req.body);
  res.json({ appointment: saved });
});

app.delete('/api/appointments/:id', auth, (req, res) => {
  db.deleteAppointment(req.params.id);
  res.json({ ok: true });
});

app.get('/api/clients', auth, (_req, res) => {
  res.json({ clients: db.getAllClientInfo() });
});

app.put('/api/clients/:phone', auth, (req, res) => {
  const saved = db.upsertClientInfo(req.params.phone, req.body);
  res.json({ client: saved });
});

app.listen(PORT, HOST, () => {
  console.log(`Cosmetolog API running on http://${HOST}:${PORT}`);
});
