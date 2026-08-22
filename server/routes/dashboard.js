import express from 'express';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../auth-middleware.js';

const router = express.Router();
router.use(requireAuth);

const today = () => new Date().toISOString().slice(0, 10);

// GET /api/dashboard/employee -> stats for the logged-in employee's home screen
router.get('/employee', (req, res) => {
  const id = req.user.id;

  const attToday = db.prepare('SELECT status, check_in, check_out FROM attendance WHERE employee_id = ? AND date = ?')
    .get(id, today());

  const monthStart = today().slice(0, 8) + '01';
  const presentDays = db.prepare(
    "SELECT COUNT(*) c FROM attendance WHERE employee_id = ? AND date >= ? AND status IN ('present','half-day')"
  ).get(id, monthStart).c;

  const pendingLeaves = db.prepare("SELECT COUNT(*) c FROM leave_requests WHERE employee_id = ? AND status = 'pending'").get(id).c;
  const balances = db.prepare('SELECT leave_type, total, used FROM leave_balances WHERE employee_id = ?').all(id);
  const leaveLeft = balances.filter((b) => b.leave_type !== 'unpaid').reduce((s, b) => s + (b.total - b.used), 0);

  const activity = db.prepare('SELECT action, created_at FROM activity_log WHERE employee_id = ? ORDER BY created_at DESC LIMIT 6').all(id);

  res.json({
    attendanceToday: attToday || null,
    stats: { presentThisMonth: presentDays, pendingLeaves, leaveBalance: leaveLeft },
    balances,
    activity,
  });
});

// GET /api/dashboard/admin -> org-wide analytics for the HR dashboard
router.get('/admin', requireAdmin, (req, res) => {
  const totalEmployees = db.prepare("SELECT COUNT(*) c FROM employees WHERE role = 'employee'").get().c;
  const presentToday = db.prepare("SELECT COUNT(*) c FROM attendance WHERE date = ? AND status IN ('present','half-day')").get(today()).c;
  const onLeaveToday = db.prepare("SELECT COUNT(*) c FROM attendance WHERE date = ? AND status = 'leave'").get(today()).c;
  const pendingLeaves = db.prepare("SELECT COUNT(*) c FROM leave_requests WHERE status = 'pending'").get().c;
  const attendanceRate = totalEmployees ? Math.round((presentToday / totalEmployees) * 100) : 0;

  // Headcount grouped by department (for a pie/bar chart).
  const byDepartment = db.prepare(
    "SELECT COALESCE(department, 'Unassigned') as department, COUNT(*) count FROM employees WHERE role = 'employee' GROUP BY department ORDER BY count DESC"
  ).all();

  // Attendance trend for the last 7 days (for a line/area chart).
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const present = db.prepare("SELECT COUNT(*) c FROM attendance WHERE date = ? AND status IN ('present','half-day')").get(date).c;
    trend.push({ date: date.slice(5), present });
  }

  const recentLeaves = db.prepare(
    `SELECT lr.id, lr.leave_type, lr.start_date, lr.end_date, lr.days, lr.status, e.name, e.employee_code
     FROM leave_requests lr JOIN employees e ON e.id = lr.employee_id
     WHERE lr.status = 'pending' ORDER BY lr.created_at DESC LIMIT 5`
  ).all();

  res.json({
    stats: { totalEmployees, presentToday, onLeaveToday, pendingLeaves, attendanceRate },
    byDepartment,
    trend,
    recentLeaves,
  });
});

export default router;
