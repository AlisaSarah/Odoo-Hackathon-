import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const employees = sqliteTable("employees", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: text("employee_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().default(""),
  address: text("address").notNull().default(""),
  department: text("department").notNull(),
  designation: text("designation").notNull(),
  manager: text("manager").notNull().default(""),
  location: text("location").notNull().default("Bengaluru"),
  joinDate: text("join_date").notNull(),
  status: text("status").notNull().default("Active"),
  avatarColor: text("avatar_color").notNull().default("violet"),
  completion: integer("completion").notNull().default(40),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: text("employee_id").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("employee"),
  verified: integer("verified", { mode: "boolean" }).notNull().default(false),
  verificationCode: text("verification_code"),
  employeeRef: integer("employee_ref").references(() => employees.id),
  createdAt: text("created_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  expiresAt: text("expires_at").notNull(),
});

export const attendance = sqliteTable("attendance", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeRef: integer("employee_ref").notNull().references(() => employees.id),
  date: text("date").notNull(),
  checkIn: text("check_in"),
  checkOut: text("check_out"),
  status: text("status").notNull(),
  workHours: real("work_hours").notNull().default(0),
  note: text("note").notNull().default(""),
});

export const leaveRequests = sqliteTable("leave_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeRef: integer("employee_ref").notNull().references(() => employees.id),
  type: text("type").notNull(),
  fromDate: text("from_date").notNull(),
  toDate: text("to_date").notNull(),
  days: real("days").notNull(),
  remarks: text("remarks").notNull(),
  status: text("status").notNull().default("Pending"),
  reviewerComment: text("reviewer_comment").notNull().default(""),
  createdAt: text("created_at").notNull(),
  reviewedAt: text("reviewed_at"),
});

export const payroll = sqliteTable("payroll", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeRef: integer("employee_ref").notNull().references(() => employees.id),
  month: text("month").notNull(),
  basic: integer("basic").notNull(),
  hra: integer("hra").notNull(),
  allowances: integer("allowances").notNull(),
  bonus: integer("bonus").notNull().default(0),
  deductions: integer("deductions").notNull().default(0),
  net: integer("net").notNull(),
  status: text("status").notNull().default("Processed"),
});

export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeRef: integer("employee_ref").notNull().references(() => employees.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  verified: integer("verified", { mode: "boolean" }).notNull().default(false),
  uploadedAt: text("uploaded_at").notNull(),
});

export const onboardingTasks = sqliteTable("onboarding_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeRef: integer("employee_ref").notNull().references(() => employees.id),
  task: text("task").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
});

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeRef: integer("employee_ref").references(() => employees.id),
  roleTarget: text("role_target"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: text("type").notNull().default("info"),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  subject: text("subject").notNull(),
  details: text("details").notNull(),
  createdAt: text("created_at").notNull(),
});
