import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { signToken, requireAuth } from '../auth-middleware.js';
import { isEmail, isStrongPassword, nonEmpty, validate } from '../validators.js';

const router = express.Router();

// Default annual leave allotment given to every new joiner.
const DEFAULT_BALANCES = [
  { leave_type: 'paid', total: 12 },
  { leave_type: 'sick', total: 8 },
  { leave_type: 'casual', total: 6 },
  { leave_type: 'unpaid', total: 30 },
];

function publicUser(row) {
  const { password_hash, ...rest } = row;
  return rest;
}

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { employee_code, name, email, password, role } = req.body || {};

  const { valid, errors } = validate({
    employee_code: [nonEmpty(employee_code), 'Employee ID is required'],
    name: [nonEmpty(name), 'Name is required'],
    email: [isEmail(email), 'Enter a valid email address'],
    password: [isStrongPassword(password), 'Password needs 8+ chars with a letter and a number'],
    role: [['employee', 'admin'].includes(role), 'Pick a valid role'],
  });
  if (!valid) return res.status(400).json({ errors });

  // Make sure the email / employee code aren't already taken.
  const clash = db
    .prepare('SELECT id FROM employees WHERE email = ? OR employee_code = ?')
    .get(email.trim().toLowerCase(), employee_code.trim());
  if (clash) {
    return res.status(409).json({ error: 'An account with that email or Employee ID already exists.' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare(
      `INSERT INTO employees (employee_code, name, email, password_hash, role, avatar, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, 1)`
    )
    .run(employee_code.trim(), name.trim(), email.trim().toLowerCase(), hash, role, name.trim()[0].toUpperCase());

  const id = info.lastInsertRowid;

  // Seed leave balances + a welcome notification so the account isn't empty.
  const balStmt = db.prepare(
    'INSERT INTO leave_balances (employee_id, leave_type, total, used) VALUES (?, ?, ?, 0)'
  );
  DEFAULT_BALANCES.forEach((b) => balStmt.run(id, b.leave_type, b.total));

  db.prepare(
    "INSERT INTO notifications (employee_id, title, message, type) VALUES (?, 'Welcome to Genesis 👋', 'Your account is ready. Complete your profile to get started.', 'success')"
  ).run(id);

  const user = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!isEmail(email) || !nonEmpty(password)) {
    return res.status(400).json({ error: 'Enter your email and password.' });
  }

  const user = db.prepare('SELECT * FROM employees WHERE email = ?').get(email.trim().toLowerCase());
  // Same generic message whether the email or password is wrong (don't leak which).
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

// GET /api/auth/me  -> current logged-in user (used to restore session on refresh)
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Account not found.' });
  res.json({ user: publicUser(user) });
});

export default router;
