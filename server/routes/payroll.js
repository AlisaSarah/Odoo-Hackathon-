import express from 'express';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../auth-middleware.js';

const router = express.Router();
router.use(requireAuth);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// GET /api/payroll/me -> my salary structure + payslip history (read-only)
router.get('/me', (req, res) => {
  const emp = db.prepare(
    'SELECT basic_salary, hra, allowances, deductions FROM employees WHERE id = ?'
  ).get(req.user.id);
  const slips = db.prepare('SELECT * FROM payslips WHERE employee_id = ? ORDER BY year DESC, month DESC').all(req.user.id);
  const gross = emp.basic_salary + emp.hra + emp.allowances;
  res.json({
    structure: { ...emp, gross, net: gross - emp.deductions },
    payslips: slips.map((s) => ({ ...s, month_name: MONTHS[s.month - 1] })),
  });
});

// GET /api/payroll  (admin) -> everyone's salary at a glance
router.get('/', requireAdmin, (req, res) => {
  const rows = db.prepare(
    `SELECT id, employee_code, name, department, designation,
            basic_salary, hra, allowances, deductions,
            (basic_salary + hra + allowances) as gross,
            (basic_salary + hra + allowances - deductions) as net
     FROM employees WHERE role = 'employee' ORDER BY name COLLATE NOCASE`
  ).all();
  const totalMonthly = rows.reduce((sum, r) => sum + r.net, 0);
  res.json({ employees: rows, totalMonthly });
});

// PUT /api/payroll/:id  (admin) -> update an employee's salary structure
router.put('/:id', requireAdmin, (req, res) => {
  const { basic_salary, hra, allowances, deductions } = req.body || {};
  const nums = [basic_salary, hra, allowances, deductions];
  if (nums.some((n) => typeof n !== 'number' || n < 0 || Number.isNaN(n))) {
    return res.status(400).json({ error: 'All salary components must be non-negative numbers.' });
  }
  db.prepare('UPDATE employees SET basic_salary = ?, hra = ?, allowances = ?, deductions = ? WHERE id = ?')
    .run(basic_salary, hra, allowances, deductions, req.params.id);

  db.prepare('INSERT INTO notifications (employee_id, title, message, type) VALUES (?, ?, ?, ?)')
    .run(req.params.id, 'Salary updated', 'Your salary structure was updated by HR.', 'info');
  res.json({ message: 'Salary structure updated' });
});

// POST /api/payroll/:id/generate  (admin) -> generate a payslip for a month
router.post('/:id/generate', requireAdmin, (req, res) => {
  const now = new Date();
  const month = Number(req.body?.month) || now.getMonth() + 1;
  const year = Number(req.body?.year) || now.getFullYear();
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Employee not found.' });

  const net = emp.basic_salary + emp.hra + emp.allowances - emp.deductions;
  try {
    db.prepare(
      `INSERT INTO payslips (employee_id, month, year, basic, hra, allowances, deductions, net_pay)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(emp.id, month, year, emp.basic_salary, emp.hra, emp.allowances, emp.deductions, net);
  } catch {
    return res.status(409).json({ error: `Payslip for ${MONTHS[month - 1]} ${year} already exists.` });
  }
  db.prepare('INSERT INTO notifications (employee_id, title, message, type) VALUES (?, ?, ?, ?)')
    .run(emp.id, 'Payslip ready', `Your salary slip for ${MONTHS[month - 1]} ${year} is available.`, 'success');
  res.status(201).json({ message: 'Payslip generated' });
});

export default router;
