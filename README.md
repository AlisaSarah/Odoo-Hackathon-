# Genesis — HRMS

> Every workday, perfectly aligned.

Dayflow is a Human Resource Management System we built for the **Odoo Hackathon**. It digitises the core HR workflow — onboarding, profiles, attendance, leave, and payroll — with a role-based experience for **Employees** and **HR/Admins**.

Everything runs locally on a real database (SQLite), talks to a proper REST API, and has a clean responsive UI.

\---

## ✨ Features

**For Employees**

* 🔐 Sign up / sign in with role selection (JWT auth, hashed passwords)
* 🏠 Personal dashboard — today's status, leave balance, recent activity
* 🕑 One-tap **check-in / check-out**, daily / weekly / monthly attendance history (+ CSV export)
* 🌴 Apply for leave (paid / sick / casual / unpaid) with live balance tracking
* 💰 Read-only payroll — salary breakdown + downloadable/printable payslips
* 👤 Edit your own profile (phone, address, etc.)
* 🔔 Notifications for leave decisions, payslips and more

**For HR / Admin**

* 📊 Analytics dashboard — headcount, attendance rate, 7-day trend chart, department split
* 👥 Employee directory with search + department filter, add / edit employees
* ✅ Leave approvals — approve/reject with comments (auto-updates balances + attendance)
* 🕑 Team attendance roster for any date, with manual override
* 💰 Full payroll control — edit salary structures, generate monthly payslips
* 🧾 Export attendance to CSV

**Nice touches**

* 🌙 Light / dark mode
* 📱 Fully responsive (works on mobile)
* ⚡ Robust validation on **both** client and server
* 🎨 Consistent design system

\---

## 🛠 Tech Stack

|Layer|Tech|
|-|-|
|Frontend|React 18, Vite, React Router, Recharts|
|Backend|Node.js, Express|
|Database|SQLite via Node's built-in `node:sqlite` — local, zero-config, no compiler needed|
|Auth|JWT + bcrypt|

We chose **SQLite** so the whole thing works offline with no external services — clone, install, run. Dynamic data lives in the DB, not static JSON.

\---

## 📁 Project Structure

```
dayflow-hrms/
├── server/                # Express REST API
│   ├── routes/            # auth, employees, attendance, leave, payroll, dashboard, notifications
│   ├── schema.sql         # database tables
│   ├── db.js              # SQLite connection
│   ├── seed.js            # demo data
│   ├── validators.js      # server-side validation
│   └── index.js           # app entry
├── client/                # React app
│   └── src/
│       ├── pages/         # one file per screen
│       ├── components/    # Layout + reusable UI
│       ├── auth.jsx       # auth / toast / theme context
│       └── api.js         # fetch wrapper
└── package.json           # root scripts (run both together)
```

\---

## 🚀 Getting Started

**Requirements:** Node.js 22.5+ (we used Node 24 LTS). The database uses Node's built-in SQLite, so there is **nothing to compile** — no build tools needed.

```bash
# 1. install everything (root + server + client)
npm run install:all

# 2. create the database with demo data
npm run seed

# 3. start both servers together
npm run dev
```

Then open **http://localhost:5173**

> The React dev server proxies `/api` to the Express server on port 4000, so you only need one command.

### 🔑 Demo Logins

|Role|Email|Password|
|-|-|-|
|HR / Admin|`admin@dayflow.com`|`Admin@123`|
|Employee|`aarav@dayflow.com`|`Pass@123`|

(All seeded employees use `Pass@123`. The login screen also has one-click demo buttons.)

### Production build (single server)

```bash
npm run build     # builds the React app
npm start         # Express serves API + the built app on http://localhost:4000
```

\---

## 🔌 API Overview

All routes are under `/api`. Protected routes need `Authorization: Bearer <token>`.

|Method|Endpoint|Description|
|-|-|-|
|POST|`/auth/signup` `/auth/login`|Register / log in|
|GET|`/dashboard/employee` `/dashboard/admin`|Dashboard data|
|GET/PUT|`/employees` `/employees/:id`|Directory, profile view/edit|
|POST|`/attendance/check-in` `/check-out`|Punch in/out|
|GET|`/attendance/me` `/attendance`|My / team attendance|
|GET/POST|`/leave/me` `/leave`|Balances, apply, list|
|PUT|`/leave/:id/review`|Approve / reject|
|GET/PUT|`/payroll/me` `/payroll/:id`|Payslips, salary control|
|GET|`/notifications`|Notifications|

\---

## 👥 Team Phoenix

* *Alisa Sarah- Team leader*
* *Anyaa Miryam Camoens- Backend management*
* *Chaithanya K R- Frontend management*
* *Adhipa G-System design*



## 🔮 Future Enhancements

* Real email verification + password reset
* Document upload (currently listed, not stored)
* Shift scheduling \& overtime
* Performance reviews / goals
* Mobile app version

