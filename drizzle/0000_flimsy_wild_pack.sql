CREATE TABLE `attendance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_ref` integer NOT NULL,
	`date` text NOT NULL,
	`check_in` text,
	`check_out` text,
	`status` text NOT NULL,
	`work_hours` real DEFAULT 0 NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`employee_ref`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`subject` text NOT NULL,
	`details` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_ref` integer NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`uploaded_at` text NOT NULL,
	FOREIGN KEY (`employee_ref`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` text NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`department` text NOT NULL,
	`designation` text NOT NULL,
	`manager` text DEFAULT '' NOT NULL,
	`location` text DEFAULT 'Bengaluru' NOT NULL,
	`join_date` text NOT NULL,
	`status` text DEFAULT 'Active' NOT NULL,
	`avatar_color` text DEFAULT 'violet' NOT NULL,
	`completion` integer DEFAULT 40 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_employee_id_unique` ON `employees` (`employee_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `employees_email_unique` ON `employees` (`email`);--> statement-breakpoint
CREATE TABLE `leave_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_ref` integer NOT NULL,
	`type` text NOT NULL,
	`from_date` text NOT NULL,
	`to_date` text NOT NULL,
	`days` real NOT NULL,
	`remarks` text NOT NULL,
	`status` text DEFAULT 'Pending' NOT NULL,
	`reviewer_comment` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`reviewed_at` text,
	FOREIGN KEY (`employee_ref`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_ref` integer,
	`role_target` text,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`type` text DEFAULT 'info' NOT NULL,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`employee_ref`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `onboarding_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_ref` integer NOT NULL,
	`task` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`employee_ref`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payroll` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_ref` integer NOT NULL,
	`month` text NOT NULL,
	`basic` integer NOT NULL,
	`hra` integer NOT NULL,
	`allowances` integer NOT NULL,
	`bonus` integer DEFAULT 0 NOT NULL,
	`deductions` integer DEFAULT 0 NOT NULL,
	`net` integer NOT NULL,
	`status` text DEFAULT 'Processed' NOT NULL,
	FOREIGN KEY (`employee_ref`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'employee' NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`verification_code` text,
	`employee_ref` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`employee_ref`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_employee_id_unique` ON `users` (`employee_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);