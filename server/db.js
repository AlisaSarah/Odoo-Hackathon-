import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'dayflow.db');

// One shared connection for the whole app. We use Node's built-in SQLite
// (node:sqlite) so there's nothing to compile or install - it ships with Node.
// It's synchronous, which keeps the route code simple and fast enough for us.
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// Run the schema on startup so a fresh clone just works.
export function initDb() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);
}

export default db;
