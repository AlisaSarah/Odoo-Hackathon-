import express from 'express';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../auth-middleware.js';
import { isDate, daysBetween, nonEmpty } from '../validators.js';

const router = express.Router();
router.use(requireAuth);

// GET /api/leave/me -> my requests + my balances
router.get('/me', (req, res) => {
  const requests = db.prepare('SELECT * FROM leave_requests WHERE employee_id = ? ORDER BY created_at DESC').all(req.user.id);
  const balances = db.prepare('SELECT leave_type, total, used FROM leave_balances WHERE employee_id = ?').all(req.user.id);
  res.json({ requests, balances });
});

// POST /api/leave -> apply for leave
router.post('/', (req, res) => {
  const { leave_type, start_date, end_date, reason } = req.body || {};
  const types = ['paid', 'sick', 'unpaid', 'casual'];

  if (!types.includes(leave_type)) return res.status(400).json({ error: 'Choose a valid leave type.' });
  if (!isDate(start_date) || !isDate(end_date)) return res.status(400).json({ error: 'Choose valid start and end dates.' });
  if (new Date(end_date) < new Date(start_date)) return res.status(400).json({ error: 'End date cannot be before start date.' });

  const days = daysBetween(start_date, end_date);

  // Check remaining balance (unpaid leave is not capped the same way).
  const bal = db.prepare('SELECT total, used FROM leave_balances WHERE employee_id = ? AND leave_type = ?')
    .get(req.user.id, leave_type);
  if (bal && leave_type !== 'unpaid' && bal.used + days > bal.total) {
    return res.status(400).json({ error: `Not enough ${leave_type} leave left. Available: ${bal.total - bal.used} day(s).` });
  }

  const info = db.prepare(
    `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days, reason, status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending')`
  ).run(req.user.id, leave_type, start_date, end_date, days, reason || '');

  db.prepare('INSERT INTO activity_log (employee_id, action) VALUES (?, ?)')
    .run(req.user.id, `Applied for ${days}-day ${leave_type} leave`);

  const request = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ request });
});

// GET /api/leave  (admin) -> all requests, optionally filtered by status
router.get('/', requireAdmin, (req, res) => {
  const { status } = req.query;
  let sql = `SELECT lr.*, e.name, e.employee_code, e.department
             FROM leave_requests lr JOIN employees e ON e.id = lr.employee_id`;
  const params = [];
  if (['pending', 'approved', 'rejected'].includes(status)) {
    sql += ' WHERE lr.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY (lr.status = "pending") DESC, lr.created_at DESC';
  res.json({ requests: db.prepare(sql).all(...params) });
});

// PUT /api/leave/:id/review  (admin) -> approve or reject
router.put('/:id/review', requireAdmin, (req, res) => {
  const { decision, comment } = req.body || {};
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'Decision must be approved or rejected.' });
  }
  const request = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(req.params.id);
  if (!request) return res.status(404).json({ error: 'Leave request not found.' });
  if (request.status !== 'pending') return res.status(409).json({ error: 'This request was already reviewed.' });

  // Wrap the whole review in a transaction so balance, calendar and
  // notification all commit together (or not at all).
  db.exec('BEGIN');
  try {
    db.prepare(
      `UPDATE leave_requests SET status = ?, admin_comment = ?, reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?`
    ).run(decision, comment || '', req.user.id, request.id);

    if (decision === 'approved') {
      // Deduct from balance and mark those days as leave on the calendar.
      if (request.leave_type !== 'unpaid') {
        db.prepare('UPDATE leave_balances SET used = used + ? WHERE employee_id = ? AND leave_type = ?')
          .run(request.days, request.employee_id, request.leave_type);
      }
      const markLeave = db.prepare(
        `INSERT INTO attendance (employee_id, date, status) VALUES (?, ?, 'leave')
         ON CONFLICT(employee_id, date) DO UPDATE SET status = 'leave'`
      );
      let d = new Date(request.start_date);
      const end = new Date(request.end_date);
      while (d <= end) {
        markLeave.run(request.employee_id, d.toISOString().slice(0, 10));
        d.setDate(d.getDate() + 1);
      }
    }

    // Notify the employee of the decision.
    db.prepare(
      'INSERT INTO notifications (employee_id, title, message, type) VALUES (?, ?, ?, ?)'
    ).run(
      request.employee_id,
      `Leave ${decision}`,
      `Your ${request.leave_type} leave (${request.start_date} to ${request.end_date}) was ${decision}.${comment ? ' Note: ' + comment : ''}`,
      decision === 'approved' ? 'success' : 'warning'
    );
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  res.json({ message: `Leave ${decision}` });
});

export default router;
