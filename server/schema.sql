-- Dayflow HRMS database schema (SQLite)
-- Everyone in the system is an "employee"; the role column decides what they can do.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS employees (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_code   TEXT UNIQUE NOT NULL,          -- human readable id shown to users, e.g. EMP001
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee','admin')),
  phone           TEXT,
  address         TEXT,
  department      TEXT,
  designation     TEXT,
  date_of_joining TEXT,
  gender          TEXT,
  dob             TEXT,
  avatar          TEXT,                            -- we store an emoji/initial-based avatar seed
  -- salary structure (monthly, in INR)
  basic_salary    REAL DEFAULT 0,
  hra             REAL DEFAULT 0,
  allowances      REAL DEFAULT 0,
  deductions      REAL DEFAULT 0,
  documents       TEXT DEFAULT '[]',              -- JSON array of {name, type}
  is_verified     INTEGER DEFAULT 1,              -- email verification flag (simulated offline)
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS attendance (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id  INTEGER NOT NULL,
  date         TEXT NOT NULL,                      -- YYYY-MM-DD
  check_in     TEXT,                               -- HH:MM
  check_out    TEXT,
  status       TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','half-day','leave')),
  work_hours   REAL DEFAULT 0,
  notes        TEXT,
  UNIQUE (employee_id, date),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id   INTEGER NOT NULL,
  leave_type    TEXT NOT NULL CHECK (leave_type IN ('paid','sick','unpaid','casual')),
  start_date    TEXT NOT NULL,
  end_date      TEXT NOT NULL,
  days          INTEGER NOT NULL,
  reason        TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_comment TEXT,
  reviewed_by   INTEGER,
  created_at    TEXT DEFAULT (datetime('now')),
  reviewed_at   TEXT,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS leave_balances (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id  INTEGER NOT NULL,
  leave_type   TEXT NOT NULL,
  total        INTEGER NOT NULL DEFAULT 0,
  used         INTEGER NOT NULL DEFAULT 0,
  UNIQUE (employee_id, leave_type),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payslips (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id  INTEGER NOT NULL,
  month        INTEGER NOT NULL,                   -- 1-12
  year         INTEGER NOT NULL,
  basic        REAL NOT NULL,
  hra          REAL NOT NULL,
  allowances   REAL NOT NULL,
  deductions   REAL NOT NULL,
  net_pay      REAL NOT NULL,
  status       TEXT DEFAULT 'paid',
  generated_at TEXT DEFAULT (datetime('now')),
  UNIQUE (employee_id, month, year),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id  INTEGER NOT NULL,
  title        TEXT NOT NULL,
  message      TEXT,
  type         TEXT DEFAULT 'info',                -- info | success | warning
  is_read      INTEGER DEFAULT 0,
  created_at   TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id  INTEGER NOT NULL,
  action       TEXT NOT NULL,
  created_at   TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attendance_emp ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_leave_emp ON leave_requests(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_notif_emp ON notifications(employee_id, is_read);
