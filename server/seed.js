// Seeds the database with a realistic company so the app has something to show.
// Run with: npm run seed   (this wipes and rebuilds the data)
import bcrypt from 'bcryptjs';
import db, { initDb } from './db.js';

initDb();

console.log('Clearing old data...');
for (const t of ['activity_log', 'notifications', 'payslips', 'leave_balances', 'leave_requests', 'attendance', 'employees']) {
  db.prepare(`DELETE FROM ${t}`).run();
}
db.prepare("DELETE FROM sqlite_sequence").run();

const pw = (p) => bcrypt.hashSync(p, 10);

// department, designation, [basic, hra, allowances, deductions]
const people = [
  ['EMP001', 'Aarav Sharma', 'aarav@genesis.com', 'employee', 'Engineering', 'Senior Software Engineer', [65000, 26000, 12000, 8500]],
  ['EMP002', 'Diya Patel', 'diya@genesis.com', 'employee', 'Engineering', 'Frontend Developer', [48000, 19000, 9000, 6200]],
  ['EMP003', 'Rohan Mehta', 'rohan@genesis.com', 'employee', 'Engineering', 'Backend Developer', [52000, 20000, 9500, 6800]],
  ['EMP004', 'Ananya Iyer', 'ananya@genesis.com', 'employee', 'Design', 'Product Designer', [46000, 18000, 8500, 5900]],
  ['EMP005', 'Kabir Singh', 'kabir@genesis.com', 'employee', 'Sales', 'Sales Executive', [38000, 15000, 11000, 4800]],
  ['EMP006', 'Isha Reddy', 'isha@genesis.com', 'employee', 'Sales', 'Account Manager', [44000, 17000, 10000, 5600]],
  ['EMP007', 'Vivaan Nair', 'vivaan@genesis.com', 'employee', 'Marketing', 'Marketing Specialist', [40000, 16000, 8000, 5100]],
  ['EMP008', 'Sara Khan', 'sara@genesis.com', 'employee', 'Marketing', 'Content Lead', [43000, 17000, 8500, 5400]],
  ['EMP009', 'Arjun Desai', 'arjun@genesis.com', 'employee', 'Finance', 'Financial Analyst', [50000, 20000, 9000, 6500]],
  ['EMP010', 'Myra Joshi', 'myra@genesis.com', 'employee', 'Support', 'Customer Success', [36000, 14000, 7000, 4500]],
  ['EMP011', 'Aditya Rao', 'aditya@genesis.com', 'employee', 'Engineering', 'DevOps Engineer', [58000, 23000, 10000, 7400]],
  ['EMP012', 'Neha Gupta', 'neha@genesis.com', 'employee', 'Support', 'Support Engineer', [37000, 14500, 7200, 4600]],
];

const insertEmp = db.prepare(
  `INSERT INTO employees
   (employee_code, name, email, password_hash, role, department, designation, date_of_joining, phone, avatar,
    basic_salary, hra, allowances, deductions, documents, gender)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

// Admin / HR account
const adminId = insertEmp.run(
  'HR001', 'Priya Menon', 'admin@genesis.com', pw('Admin@123'), 'admin', 'Human Resources', 'HR Manager',
  '2021-03-15', '+91 98765 43210', 'P', 90000, 30000, 15000, 9000, '["Offer Letter.pdf","ID Proof.pdf"]', 'Female'
).lastInsertRowid;

const ids = {};
people.forEach(([code, name, email, role, dept, desig, sal], i) => {
  const joinYear = 2022 + (i % 3);
  const id = insertEmp.run(
    code, name, email, pw('Pass@123'), role, dept, desig,
    `${joinYear}-0${(i % 9) + 1}-1${i % 9}`, `+91 9${(800000000 + i * 111111)}`,
    name[0], sal[0], sal[1], sal[2], sal[3],
    '["Offer Letter.pdf","Aadhaar.pdf","PAN Card.pdf"]', i % 2 ? 'Female' : 'Male'
  ).lastInsertRowid;
  ids[code] = id;
});

const allEmpIds = Object.values(ids);

// Leave balances for everyone (including admin)
const balStmt = db.prepare('INSERT INTO leave_balances (employee_id, leave_type, total, used) VALUES (?, ?, ?, ?)');
[adminId, ...allEmpIds].forEach((id) => {
  balStmt.run(id, 'paid', 12, Math.floor(Math.random() * 4));
  balStmt.run(id, 'sick', 8, Math.floor(Math.random() * 3));
  balStmt.run(id, 'casual', 6, Math.floor(Math.random() * 2));
  balStmt.run(id, 'unpaid', 30, 0);
});

// Attendance history for the previous 21 days (skip weekends).
// Today is added separately below so the admin dashboard always has useful
// numbers while Aarav remains free for a live employee check-in demo.
console.log('Generating attendance history...');
const attStmt = db.prepare(
  `INSERT OR IGNORE INTO attendance (employee_id, date, check_in, check_out, status, work_hours)
   VALUES (?, ?, ?, ?, ?, ?)`
);
for (let back = 21; back >= 1; back--) {
  const d = new Date();
  d.setDate(d.getDate() - back);
  const dow = d.getDay();
  if (dow === 0 || dow === 6) continue; // weekend
  const date = d.toISOString().slice(0, 10);
  allEmpIds.forEach((id) => {
    const roll = Math.random();
    if (roll < 0.05) { attStmt.run(id, date, null, null, 'absent', 0); return; }
    if (roll < 0.12) { attStmt.run(id, date, '09:45', '13:30', 'half-day', 3.75); return; }
    const inH = 9 + Math.floor(Math.random() * 1);
    const inM = Math.floor(Math.random() * 45);
    const checkIn = `0${inH}:${String(inM).padStart(2, '0')}`;
    const outH = 17 + Math.floor(Math.random() * 2);
    const checkOut = `${outH}:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}`;
    const hours = Math.round((outH + 0.3 - inH) * 10) / 10;
    attStmt.run(id, date, checkIn, checkOut, 'present', hours);
  });
}

const currentDate = new Date().toISOString().slice(0, 10);
allEmpIds.filter((id) => id !== ids.EMP001).forEach((id, i) => {
  if (i < 8) { attStmt.run(id, currentDate, '09:10', '17:45', 'present', 8.6); return; }
  if (i === 8) { attStmt.run(id, currentDate, '09:40', '13:20', 'half-day', 3.7); return; }
  if (i === 9) { attStmt.run(id, currentDate, null, null, 'absent', 0); return; }
  attStmt.run(id, currentDate, null, null, 'leave', 0);
});

// A few leave requests in various states
console.log('Adding leave requests...');
const leaveStmt = db.prepare(
  `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days, reason, status, admin_comment, reviewed_by, reviewed_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const future = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
leaveStmt.run(ids.EMP001, 'sick', future(2), future(3), 2, 'Fever and rest advised by doctor', 'pending', null, null, null);
leaveStmt.run(ids.EMP005, 'paid', future(10), future(14), 5, 'Family function out of town', 'pending', null, null, null);
leaveStmt.run(ids.EMP007, 'casual', future(1), future(1), 1, 'Personal errand', 'pending', null, null, null);
leaveStmt.run(ids.EMP001, 'paid', '2026-07-20', '2026-07-22', 3, 'Short vacation', 'approved', 'Approved, enjoy!', adminId, '2026-07-15 10:20:00');
leaveStmt.run(ids.EMP009, 'sick', '2026-08-01', '2026-08-01', 1, 'Migraine', 'rejected', 'Please attach a medical note next time', adminId, '2026-07-31 16:00:00');

// Payslips for last two months for a few employees
console.log('Generating payslips...');
const slipStmt = db.prepare(
  `INSERT INTO payslips (employee_id, month, year, basic, hra, allowances, deductions, net_pay)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
);
allEmpIds.forEach((id) => {
  const e = db.prepare('SELECT basic_salary, hra, allowances, deductions FROM employees WHERE id = ?').get(id);
  const net = e.basic_salary + e.hra + e.allowances - e.deductions;
  [[6, 2026], [7, 2026]].forEach(([m, y]) => slipStmt.run(id, m, y, e.basic_salary, e.hra, e.allowances, e.deductions, net));
});

// Notifications + activity for a couple of accounts so demos look alive
const notify = db.prepare('INSERT INTO notifications (employee_id, title, message, type) VALUES (?, ?, ?, ?)');
notify.run(ids.EMP001, 'Payslip ready', 'Your salary slip for Jul 2026 is available.', 'success');
notify.run(ids.EMP001, 'Leave approved', 'Your paid leave (2026-07-20 to 2026-07-22) was approved.', 'success');
notify.run(adminId, '3 leave requests pending', 'You have leave requests waiting for review.', 'warning');

const act = db.prepare('INSERT INTO activity_log (employee_id, action) VALUES (?, ?)');
act.run(ids.EMP001, 'Checked in at 09:12');
act.run(ids.EMP001, 'Applied for 3-day paid leave');
act.run(ids.EMP001, 'Downloaded July payslip');

console.log('\n✅ Seed complete!\n');
console.log('  Login credentials');
console.log('  ─────────────────');
console.log('  Admin / HR :  admin@genesis.com   /  Admin@123');
console.log('  Employee   :  aarav@genesis.com   /  Pass@123');
console.log('  (all seeded employees use the password  Pass@123)\n');
