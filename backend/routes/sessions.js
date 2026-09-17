const express = require('express');
const crypto = require('crypto');
const db = require('../db/init');
const { authenticate, requireRole } = require('../middleware/auth');
const { currentToken } = require('../utils/qr');

module.exports = function sessionsRouter(io) {
  const router = express.Router();

  // Broadcast a fresh rotating QR token to everyone watching this session.
  function broadcastToken(session) {
    const payload = currentToken(session.qr_secret, session.id);
    io.to(`session:${session.id}`).emit('qr:update', {
      sessionId: session.id,
      ...payload,
    });
    return payload;
  }

  // CR / Admin: create a new attendance session
  router.post('/', authenticate, requireRole('cr', 'admin'), (req, res) => {
    const { title, course_unit, window_seconds } = req.body;
    if (!title || !course_unit) {
      return res.status(400).json({ error: 'Session title and course unit are required' });
    }

    const qrSecret = crypto.randomBytes(24).toString('hex');
    const result = db
      .prepare(
        `INSERT INTO sessions (title, course_unit, created_by, qr_secret, window_seconds)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(title, course_unit, req.user.id, qrSecret, window_seconds || 25);

    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ session });
  });

  // CR / Admin: list sessions they created (or all, for admin)
  router.get('/', authenticate, requireRole('cr', 'admin'), (req, res) => {
    const rows =
      req.user.role === 'admin'
        ? db
            .prepare(
              `SELECT s.*, u.full_name AS created_by_name,
                (SELECT COUNT(*) FROM attendance a WHERE a.session_id = s.id) AS attendance_count
               FROM sessions s JOIN users u ON u.id = s.created_by
               ORDER BY s.starts_at DESC`
            )
            .all()
        : db
            .prepare(
              `SELECT s.*, u.full_name AS created_by_name,
                (SELECT COUNT(*) FROM attendance a WHERE a.session_id = s.id) AS attendance_count
               FROM sessions s JOIN users u ON u.id = s.created_by
               WHERE s.created_by = ? ORDER BY s.starts_at DESC`
            )
            .all(req.user.id);

    res.json({ sessions: rows });
  });

  // Student: list currently active sessions for their course
  router.get('/active', authenticate, requireRole('student'), (req, res) => {
    const rows = db
      .prepare(
        `SELECT s.id, s.title, s.course_unit, s.starts_at, u.full_name AS created_by_name
         FROM sessions s JOIN users u ON u.id = s.created_by
         WHERE s.status = 'active' AND (s.course_unit = ? OR ? IS NULL)
         ORDER BY s.starts_at DESC`
      )
      .all(req.user.course, req.user.course);

    res.json({ sessions: rows });
  });

  // Get one session (creator or admin), including a fresh QR token
  router.get('/:id', authenticate, requireRole('cr', 'admin'), (req, res) => {
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (req.user.role !== 'admin' && session.created_by !== req.user.id) {
      return res.status(403).json({ error: 'You do not manage this session' });
    }

    const qr = session.status === 'active' ? currentToken(session.qr_secret, session.id) : null;
    res.json({ session, qr });
  });

  // Close a session (stops accepting new scans)
  router.patch('/:id/close', authenticate, requireRole('cr', 'admin'), (req, res) => {
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (req.user.role !== 'admin' && session.created_by !== req.user.id) {
      return res.status(403).json({ error: 'You do not manage this session' });
    }

    db.prepare(`UPDATE sessions SET status = 'closed', ends_at = datetime('now') WHERE id = ?`).run(
      session.id
    );
    io.to(`session:${session.id}`).emit('session:closed', { sessionId: session.id });
    res.json({ ok: true });
  });

  // Expose the broadcaster so server.js can run the rotation interval
  router.broadcastToken = broadcastToken;
  return router;
};
