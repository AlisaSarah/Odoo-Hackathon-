import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../auth-middleware.js';
import { isEmail, nonEmpty } from '../validators.js';

const router = express.Router();
router.use(requireAuth);

const strip = (row) => {
  if (!row) return row;
  const { password_hash, ...rest } = row;
  rest.documents = JSON.parse(rest.documents || '[]');
  rest.gross = (rest.basic_salary || 0) + (rest.hra || 0) + (rest.allowances || 0);
  rest.net = rest.gross - (rest.deductions || 0);
  return rest;
};

// GET /api/employees  (admin) -> list with search + department filter
router.get('/', requireAdmin, (req, res) => {
  const { q = '', department = '' } = req.query;
  let sql = 'SELECT * FROM employees WHERE 1=1';
  const params = [];
  if (q) {
    sql += ' AND (name LIKE ? OR email LIKE ? OR employee_code LIKE ? OR designation LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  if (department) {
    sql += ' AND department = ?';
    params.push(department);
  }
  sql += ' ORDER BY name COLLATE NOCASE';
  const rows = db.prepare(sql).all(...params).map(strip);

  // Distinct department list powers the filter dropdown on the client.
  const departments = db
    .prepare("SELECT DISTINCT department FROM employees WHERE department IS NOT NULL AND department != '' ORDER BY department")
    .all()
    .map((r) => r.department);

  res.json({ employees: rows, departments });
});

// GET /api/employees/:id -> employee can only read their own record
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (req.user.role !== 'admin' && req.user.id !== id) {
    return res.status(403).json({ error: 'You can only view your own profile.' });
  }
  const row = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'Employee not found.' });
  res.json({ employee: strip(row) });
});

// Fields an employee is allowed to change about themselves.
const SELF_EDITABLE = ['phone', 'address', 'avatar', 'dob', 'gender'];
// Everything an admin may change.
const ADMIN_EDITABLE = [
  ...SELF_EDITABLE, 'name', 'email', 'department', 'designation',
  'date_of_joining', 'basic_salary', 'hra', 'allowances', 'deductions', 'status',
];

// PUT /api/employees/:id
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && req.user.id !== id) {
    return res.status(403).json({ error: 'You can only edit your own profile.' });
  }

  const allowed = isAdmin ? ADMIN_EDITABLE : SELF_EDITABLE;
  const updates = {};
  for (const key of allowed) {
    if (key in (req.body || {})) updates[key] = req.body[key];
  }
  if ('email' in updates && !isEmail(updates.email)) {
    return res.status(400).json({ error: 'Enter a valid email.' });
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Nothing to update.' });
  }

  const setClause = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
  db.prepare(`UPDATE employees SET ${setClause} WHERE id = ?`).run(...Object.values(updates), id);

  db.prepare('INSERT INTO activity_log (employee_id, action) VALUES (?, ?)')
    .run(id, 'Updated profile details');

  const row = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
  res.json({ employee: strip(row) });
});

// POST /api/employees  (admin) -> add a new employee manually
router.post('/', requireAdmin, (req, res) => {
  const { employee_code, name, email, department, designation, role = 'employee' } = req.body || {};
  if (!nonEmpty(employee_code) || !nonEmpty(name) || !isEmail(email)) {
    return res.status(400).json({ error: 'Employee ID, name and a valid email are required.' });
  }
  const clash = db.prepare('SELECT id FROM employees WHERE email = ? OR employee_code = ?')
    .get(email.toLowerCase(), employee_code);
  if (clash) return res.status(409).json({ error: 'Email or Employee ID already in use.' });

  // Temporary password = employee code; admin can share it and the user resets later.
  const hash = bcrypt.hashSync(employee_code, 10);
  const info = db.prepare(
    `INSERT INTO employees (employee_code, name, email, password_hash, role, department, designation, avatar, date_of_joining)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now'))`
  ).run(employee_code, name, email.toLowerCase(), hash, role, department || null, designation || null, name[0].toUpperCase());

  const balStmt = db.prepare('INSERT INTO leave_balances (employee_id, leave_type, total, used) VALUES (?, ?, ?, 0)');
  [['paid', 12], ['sick', 8], ['casual', 6], ['unpaid', 30]].forEach(([t, n]) => balStmt.run(info.lastInsertRowid, t, n));

  const row = db.prepare('SELECT * FROM employees WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ employee: strip(row) });
});

export default router;
