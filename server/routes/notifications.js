import express from 'express';
import db from '../db.js';
import { requireAuth } from '../auth-middleware.js';

const router = express.Router();
router.use(requireAuth);

// GET /api/notifications -> my notifications + unread count
router.get('/', (req, res) => {
  const items = db.prepare('SELECT * FROM notifications WHERE employee_id = ? ORDER BY created_at DESC LIMIT 30').all(req.user.id);
  const unread = db.prepare('SELECT COUNT(*) c FROM notifications WHERE employee_id = ? AND is_read = 0').get(req.user.id).c;
  res.json({ notifications: items, unread });
});

// PUT /api/notifications/read-all -> mark everything read
router.put('/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE employee_id = ?').run(req.user.id);
  res.json({ message: 'All caught up' });
});

// PUT /api/notifications/:id/read -> mark one read
router.put('/:id/read', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND employee_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Marked read' });
});

export default router;
