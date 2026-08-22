# Genesis five-minute workflow video

This is designed to finish in about **4 minutes 45 seconds**, leaving a small safety margin under a five-minute limit.

## Before recording

### 1. Reset and start Genesis

Open Git Bash or the VS Code terminal inside `genesis-hrms`:

```bash
npm run seed
npm run dev
```

Wait until the terminal shows both the Genesis API and Vite addresses. Open [http://localhost:5173](http://localhost:5173).

### 2. Prepare the screen

- Use a 1920×1080 screen if possible.
- Set browser zoom to 90% so tables fit.
- Close unrelated tabs and hide bookmarks containing personal information.
- Turn on Do Not Disturb so notifications do not appear.
- Keep only two windows ready: the browser and VS Code with the project folder open.
- Put the login page on screen before recording.
- Test the microphone and speak slightly slower than normal conversation.
- Do one complete practice run after seeding, then run `npm run seed` again before the final take.

### 3. Record

Use OBS if it is already installed. Otherwise, use Windows Snipping Tool screen recording or Xbox Game Bar (`Win + Alt + R`) and enable the microphone.

Record at 1080p and 30 fps. Aim for 4:40–4:50. Save the result as:

```text
Genesis_HRMS_Workflow.mp4
```

## Exact demo order and script

Do not try to show every button. Show one connected admin-to-employee workflow and explain that the same database powers every screen.

### 0:00–0:20 — Introduction

**On screen:** Genesis login page with the supplied logo.

**Say:**

> Hello, I am Adhipa from Team Genesis, along with [say teammate names]. For the Odoo x NMIT Hackathon, we built Genesis, a full-stack Human Resource Management System. It gives employees and HR one connected place for profiles, attendance, leave, payroll, analytics, and notifications.

### 0:20–0:42 — Problem and solution

**On screen:** Slowly move over the login-page feature list; do not click yet.

**Say:**

> Small organisations often keep HR work in separate spreadsheets, registers, and messages. That causes duplicated data, delayed approvals, and poor visibility. Genesis replaces that fragmented process with two role-based workflows—one for employees and one for HR—backed by a single live database.

### 0:42–1:00 — Architecture and proof of dynamic data

**On screen:** Briefly switch to VS Code. Show the `client`, `server/routes`, `schema.sql`, and `seed.js` files in the Explorer. Then return to the browser.

**Say:**

> The frontend is React, the backend is an Express REST API, and persistent data is stored in local SQLite. Passwords are hashed, login sessions use JWT, and protected API routes check both identity and role. The seed program generates realistic demo records; the application does not depend on static JSON or a cloud service.

### 1:00–1:28 — Admin login and analytics

**Action:** Click **Use** beside Admin / HR, then **Sign in**. Pause on the dashboard and point to the stat cards and charts.

**Say:**

> I will begin as HR. The dashboard calculates headcount, today's attendance, leave, pending approvals, attendance rate, the seven-day trend, and department distribution directly from SQLite. These values are not hard-coded; they change when data changes.

### 1:28–1:50 — Employee directory

**Action:** Open **Employees**. Type `Aarav` in search, clear it, and briefly change the department filter. Open Aarav with **View**, then close the modal.

**Say:**

> The employee directory supports live search and department filtering. HR can add employees, inspect their complete profile, and edit authorised job and salary fields. Input is validated again by the server before any database update.

### 1:50–2:10 — Team attendance

**Action:** Open **Attendance**. Show today's roster and the quick-status dropdown on any employee other than Aarav. Click **Export CSV** once.

**Say:**

> HR can inspect the attendance roster for any date, correct a status when needed, and export the current report as CSV. Employees have a separate view for their own check-ins and history.

### 2:10–2:45 — Leave approval: the main connected workflow

**Action:** Open **Leave Approvals**. Find Aarav's sick-leave request, click **Review**, type `Approved. Get well soon.` and click **Approve**. Let the success toast appear.

**Say:**

> Here is the important end-to-end workflow. Aarav has submitted sick leave. When HR approves it, one database transaction updates the request, deducts the correct leave balance, marks the approved dates in attendance, and creates an employee notification. If any step fails, the transaction rolls everything back, keeping the data consistent.

### 2:45–3:08 — Payroll action

**Action:** Open **Payroll**. Aarav is the first row. Point to the salary components and total monthly payout, then click Aarav's **Payslip** button once.

**Say:**

> HR can maintain basic salary, HRA, allowances, and deductions. Net pay is calculated automatically. Generating a payslip stores a monthly snapshot and notifies the employee. A database constraint prevents duplicate payslips for the same month.

### 3:08–3:25 — Switch roles

**Action:** Click **Logout**. On the login page click **Use** beside Employee, then **Sign in**.

**Say:**

> I will now switch to the employee role to show that the HR actions have reached the same user's account through the database.

### 3:25–3:50 — Employee dashboard and check-in

**Action:** On Aarav's dashboard click **Check in**. Pause for the success toast and changed status.

**Say:**

> The employee dashboard shows only Aarav's information: today's attendance, leave balance, pending requests, and recent activity. Check-in uses the employee ID from the verified token, records the current time, and immediately updates the dashboard.

### 3:50–4:15 — Notifications prove the connection

**Action:** Open **Notifications**. Point to the new leave-approved and payslip-ready entries. Click **Mark all read**.

**Say:**

> These are the notifications created by the admin actions we just performed. This proves the two interfaces are not separate demos—they are connected through the same API and SQLite database. The unread counter is also refreshed automatically.

### 4:15–4:35 — Employee payslip and leave record

**Action:** Open **Payroll**, open the newest payslip, and point to the **Print / Save PDF** button. Close it, then open **Leave** and point to balances and request history.

**Say:**

> Employees have read-only payroll access and can print or save a proper salary slip. Their leave page shows the updated balance and full request history, while HR alone controls approvals and salary changes.

### 4:35–4:48 — UI and conclusion

**Action:** Toggle dark mode once. If time permits, narrow the browser briefly to show the mobile menu, then return to the dashboard.

**Say:**

> Genesis also includes responsive navigation, a consistent light and dark design, reusable components, and validation on both client and server. It is a complete local-first HR workflow that is simple to run, understand, and extend. Thank you.

## What this video proves to the judges

- Dynamic database-backed data, not static JSON
- A working frontend, backend API, and local relational database
- Two distinct roles with server-side permission checks
- A connected leave and payroll workflow across both roles
- Input validation, password hashing, JWT authentication, and SQL constraints
- Clean navigation, responsive layout, consistent branding, and dark mode
- Local/offline operation with a fake-data generator for repeatable judging

## Final submission check

- Video is no longer than five minutes.
- Voice is clear and the cursor moves slowly.
- No passwords, emails, or notifications other than the provided demo data are visible.
- Repository is public if the portal requires it.
- Latest working code is on `main`.
- Every team member has meaningful commits under their own GitHub account.
- README team placeholders are replaced before submission.
- The video link has permission set so judges can open it.
- Follow any exact upload/link instruction sent to the team leader by email; that private instruction takes priority over this general checklist.
