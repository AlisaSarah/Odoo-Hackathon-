import express from 'express';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../auth-middleware.js';
import { isDate } from '../validators.js';

const router = express.Router();
router.use(requireAuth);

const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);

// Difference between two HH:MM strings, in hours (1 decimal).
function hoursBetween(inT, outT) {
  const [ih, im] = inT.split(':').map(Number);
  const [oh, om] = outT.split(':').map(Number);
  return Math.max(0, Math.round(((oh * 60 + om - ih * 60 - im) / 60) * 10) / 10);
}

// POST /api/attendance/check-in
router.post('/check-in', (req, res) => {
  const empId = req.user.id;
  const existing = db.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?').get(empId, today());
  if (existing && existing.check_in) {
    return res.status(409).json({ error: `Already checked in at ${existing.check_in}.` });
  }
  const time = nowTime();
  db.prepare(
    `INSERT INTO attendance (employee_id, date, check_in, status)
     VALUES (?, ?, ?, 'present')
     ON CONFLICT(employee_id, date) DO UPDATE SET check_in = excluded.check_in, status = 'present'`
  ).run(empId, today(), time);
  db.prepare('INSERT INTO activity_log (employee_id, action) VALUES (?, ?)').run(empId, `Checked in at ${time}`);
  res.json({ message: 'Checked in', check_in: time });
});

// POST /api/attendance/check-out
router.post('/check-out', (req, res) => {
  const empId = req.user.id;
  const rec = db.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?').get(empId, today());
  if (!rec || !rec.check_in) return res.status(400).json({ error: 'You need to check in first.' });
  if (rec.check_out) return res.status(409).json({ error: `Already checked out at ${rec.check_out}.` });

  const time = nowTime();
  const hours = hoursBetween(rec.check_in, time);
  // Under 4 hours logged counts as a half-day.
  const status = hours < 4 ? 'half-day' : 'present';
  db.prepare('UPDATE attendance SET check_out = ?, work_hours = ?, status = ? WHERE id = ?')
    .run(time, hours, status, rec.id);
  db.prepare('INSERT INTO activity_log (employee_id, action) VALUES (?, ?)').run(empId, `Checked out at ${time}`);
  res.json({ message: 'Checked out', check_out: time, work_hours: hours, status });
});

// GET /api/attendance/me?from=&to=  -> my records + today's status
router.get('/me', (req, res) => {
  const { from, to } = req.query;
  let sql = 'SELECT * FROM attendance WHERE employee_id = ?';
  const params = [req.user.id];
  if (isDate(from)) { sql += ' AND date >= ?'; params.push(from); }
  if (isDate(to)) { sql += ' AND date <= ?'; params.push(to); }
  sql += ' ORDER BY date DESC';
  const records = db.prepare(sql).all(...params);
  const todayRec = db.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?').get(req.user.id, today());
  res.json({ records, today: todayRec || null });
});

// GET /api/attendance  (admin) -> everyone's attendance for a given date
router.get('/', requireAdmin, (req, res) => {
  const date = isDate(req.query.date) ? req.query.date : today();
  // LEFT JOIN so employees with no record show up as "not marked".
  const rows = db.prepare(
    `SELECT e.id as employee_id, e.name, e.employee_code, e.department,
            a.check_in, a.check_out, a.status, a.work_hours
     FROM employees e
     LEFT JOIN attendance a ON a.employee_id = e.id AND a.date = ?
     WHERE e.role = 'employee'
     ORDER BY e.name COLLATE NOCASE`
  ).all(date);
  res.json({ date, records: rows });
});

// PUT /api/attendance/mark  (admin) -> manually set/override a status
router.put('/mark', requireAdmin, (req, res) => {
  const { employee_id, date, status } = req.body || {};
  const valid = ['present', 'absent', 'half-day', 'leave'];
  if (!employee_id || !isDate(date) || !valid.includes(status)) {
    return res.status(400).json({ error: 'employee_id, a valid date and status are required.' });
  }
  db.prepare(
    `INSERT INTO attendance (employee_id, date, status) VALUES (?, ?, ?)
     ON CONFLICT(employee_id, date) DO UPDATE SET status = excluded.status`
  ).run(employee_id, date, status);
  res.json({ message: 'Attendance updated' });
});

export default router;
