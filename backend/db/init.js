const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'attendance.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_number TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','cr','student')),
  course TEXT,
  year_of_study INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  course_unit TEXT NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','closed')),
  qr_secret TEXT NOT NULL,
  starts_at TEXT DEFAULT (datetime('now')),
  ends_at TEXT,
  window_seconds INTEGER NOT NULL DEFAULT 25
);

CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  student_id INTEGER NOT NULL REFERENCES users(id),
  signature TEXT NOT NULL,
  device_fingerprint TEXT NOT NULL,
  ip_address TEXT,
  marked_at TEXT DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'valid' CHECK(status IN ('valid','flagged')),
  flag_reason TEXT,
  UNIQUE(session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_fingerprint ON attendance(session_id, device_fingerprint);
`);

module.exports = db;
