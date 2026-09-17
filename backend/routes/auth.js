const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/init');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { registration_number, password } = req.body;
  if (!registration_number || !password) {
    return res.status(400).json({ error: 'Registration number and password are required' });
  }

  const user = db
    .prepare('SELECT * FROM users WHERE registration_number = ?')
    .get(registration_number.trim());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid registration number or password' });
  }

  const token = jwt.sign(
    {
      id: user.id,
      registration_number: user.registration_number,
      full_name: user.full_name,
      role: user.role,
      course: user.course,
    },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      registration_number: user.registration_number,
      full_name: user.full_name,
      role: user.role,
      course: user.course,
      year_of_study: user.year_of_study,
    },
  });
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
