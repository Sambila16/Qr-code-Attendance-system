const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/init');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

function studentRecord(user) {
  return {
    id: user.id,
    registration_number: user.registration_number,
    full_name: user.full_name,
    role: user.role,
    course: user.course,
    year_of_study: user.year_of_study,
    created_at: user.created_at,
  };
}

router.use(authenticate, requireRole('cr', 'admin'));

// A CR is scoped to their own course; admins can view the whole roster.
router.get('/', (req, res) => {
  const students = req.user.role === 'admin'
    ? db.prepare(`SELECT id, registration_number, full_name, role, course, year_of_study, created_at
                  FROM users WHERE role = 'student' ORDER BY full_name COLLATE NOCASE`).all()
    : db.prepare(`SELECT id, registration_number, full_name, role, course, year_of_study, created_at
                  FROM users WHERE role = 'student' AND course = ? ORDER BY full_name COLLATE NOCASE`)
        .all(req.user.course);

  res.json({ students });
});

router.post('/', (req, res) => {
  const fullName = typeof req.body.full_name === 'string' ? req.body.full_name.trim() : '';
  const registrationNumber = typeof req.body.registration_number === 'string'
    ? req.body.registration_number.trim()
    : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const year = Number(req.body.year_of_study);
  // CR input never controls the assigned course. Admins must explicitly select one.
  const course = req.user.role === 'cr'
    ? req.user.course
    : (typeof req.body.course === 'string' ? req.body.course.trim() : '');

  if (!fullName || !registrationNumber || !password || !course) {
    return res.status(400).json({ error: 'Full name, registration number, temporary password, year, and course are required' });
  }
  if (!Number.isInteger(year) || year < 1 || year > 10) {
    return res.status(400).json({ error: 'Year of study must be a whole number between 1 and 10' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Temporary password must be at least 6 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE registration_number = ?').get(registrationNumber);
  if (existing) {
    return res.status(409).json({ error: 'A user with this registration number already exists' });
  }

  const passwordHash = bcrypt.hashSync(password, 12);
  try {
    const result = db.prepare(`INSERT INTO users
      (registration_number, password_hash, full_name, role, course, year_of_study)
      VALUES (?, ?, ?, 'student', ?, ?)`)
      .run(registrationNumber, passwordHash, fullName, course, year);
    const student = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ student: studentRecord(student) });
  } catch (err) {
    if (err.code && err.code.includes('SQLITE_CONSTRAINT')) {
      return res.status(409).json({ error: 'A user with this registration number already exists' });
    }
    throw err;
  }
});

module.exports = router;
