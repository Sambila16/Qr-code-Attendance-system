const express = require('express');
const db = require('../db/init');
const { authenticate, requireRole } = require('../middleware/auth');
const { verifyToken } = require('../utils/qr');

module.exports = function attendanceRouter(io) {
  const router = express.Router();

  // Student: mark attendance by scanning the rotating QR + signing
  router.post('/mark', authenticate, requireRole('student'), (req, res) => {
    const { session_id, token, signature, device_fingerprint } = req.body;

    if (!session_id || !token || !signature || !device_fingerprint) {
      return res.status(400).json({
        error: 'Session, QR token, signature and device information are all required',
      });
    }

    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(session_id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status !== 'active') {
      return res.status(400).json({ error: 'This session is closed and no longer accepting attendance' });
    }

    if (!verifyToken(session.qr_secret, session.id, token)) {
      return res.status(400).json({
        error: 'This QR code has expired. Ask the class representative to show the current code and scan again.',
      });
    }

    const existing = db
      .prepare('SELECT id FROM attendance WHERE session_id = ? AND student_id = ?')
      .get(session_id, req.user.id);
    if (existing) {
      return res.status(409).json({ error: 'You have already marked attendance for this session' });
    }

    // Anti-cheat: has this device already been used to mark a *different* student
    // present in this same session? That's a strong proxy-attendance signal.
    const sameDeviceOtherStudents = db
      .prepare(
        `SELECT a.id, u.full_name FROM attendance a
         JOIN users u ON u.id = a.student_id
         WHERE a.session_id = ? AND a.device_fingerprint = ? AND a.student_id != ?`
      )
      .all(session_id, device_fingerprint, req.user.id);

    const ip = req.ip;
    let status = 'valid';
    let flagReason = null;

    if (sameDeviceOtherStudents.length > 0) {
      status = 'flagged';
      flagReason = `Same device already used to mark attendance for: ${sameDeviceOtherStudents
        .map((r) => r.full_name)
        .join(', ')}`;
    }

    const insert = db
      .prepare(
        `INSERT INTO attendance (session_id, student_id, signature, device_fingerprint, ip_address, status, flag_reason)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(session_id, req.user.id, signature, device_fingerprint, ip, status, flagReason);

    // If this device is now implicated in proxy attendance, retroactively flag
    // the earlier record(s) too so the CR sees both sides of the conflict.
    if (sameDeviceOtherStudents.length > 0) {
      const ids = sameDeviceOtherStudents.map((r) => r.id);
      const placeholders = ids.map(() => '?').join(',');
      db.prepare(
        `UPDATE attendance SET status = 'flagged',
         flag_reason = COALESCE(flag_reason || '; ', '') || 'Same device also used by ' || ?
         WHERE id IN (${placeholders})`
      ).run(req.user.full_name, ...ids);
    }

    const record = db
      .prepare(
        `SELECT a.*, u.full_name, u.registration_number FROM attendance a
         JOIN users u ON u.id = a.student_id WHERE a.id = ?`
      )
      .get(insert.lastInsertRowid);

    io.to(`session:${session_id}`).emit('attendance:new', record);

    res.status(201).json({
      ok: true,
      status,
      message:
        status === 'flagged'
          ? 'Attendance recorded but flagged for review (possible shared-device use)'
          : 'Attendance marked successfully',
    });
  });

  // CR / Admin: review attendance with filters
  router.get('/', authenticate, requireRole('cr', 'admin'), (req, res) => {
    const { session_id, status, search } = req.query;

    let sql = `
      SELECT a.*, u.full_name, u.registration_number, s.title AS session_title, s.course_unit
      FROM attendance a
      JOIN users u ON u.id = a.student_id
      JOIN sessions s ON s.id = a.session_id
      WHERE 1=1`;
    const params = [];

    if (req.user.role !== 'admin') {
      sql += ' AND s.created_by = ?';
      params.push(req.user.id);
    }
    if (session_id) {
      sql += ' AND a.session_id = ?';
      params.push(session_id);
    }
    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (u.full_name LIKE ? OR u.registration_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY a.marked_at DESC';

    const rows = db.prepare(sql).all(...params);
    res.json({ attendance: rows });
  });

  // Student: their own attendance history
  router.get('/mine', authenticate, requireRole('student'), (req, res) => {
    const rows = db
      .prepare(
        `SELECT a.id, a.marked_at, a.status, s.title AS session_title, s.course_unit
         FROM attendance a JOIN sessions s ON s.id = a.session_id
         WHERE a.student_id = ? ORDER BY a.marked_at DESC`
      )
      .all(req.user.id);
    res.json({ attendance: rows });
  });

  // CR / Admin: export filtered attendance as CSV (for printing / records)
  router.get('/export.csv', authenticate, requireRole('cr', 'admin'), (req, res) => {
    const { session_id } = req.query;
    let sql = `
      SELECT u.registration_number, u.full_name, s.title AS session_title, s.course_unit,
             a.marked_at, a.status, a.flag_reason
      FROM attendance a
      JOIN users u ON u.id = a.student_id
      JOIN sessions s ON s.id = a.session_id
      WHERE 1=1`;
    const params = [];
    if (req.user.role !== 'admin') {
      sql += ' AND s.created_by = ?';
      params.push(req.user.id);
    }
    if (session_id) {
      sql += ' AND a.session_id = ?';
      params.push(session_id);
    }
    sql += ' ORDER BY a.marked_at ASC';

    const rows = db.prepare(sql).all(...params);
    const header = 'Registration Number,Full Name,Session,Course Unit,Marked At,Status,Flag Reason\n';
    const body = rows
      .map((r) =>
        [
          r.registration_number,
          r.full_name,
          r.session_title,
          r.course_unit,
          r.marked_at,
          r.status,
          (r.flag_reason || '').replace(/,/g, ';'),
        ]
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance-export.csv"');
    res.send(header + body);
  });

  return router;
};
