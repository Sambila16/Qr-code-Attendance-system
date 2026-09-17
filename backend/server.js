require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const db = require('./db/init');
const { currentToken, ROTATE_SECONDS } = require('./utils/qr');
const authRoutes = require('./routes/auth');
const studentsRoutes = require('./routes/students');
const settingsRoutes = require('./routes/settings');
const buildSessionsRouter = require('./routes/sessions');
const buildAttendanceRouter = require('./routes/attendance');

const app = express();
const server = http.createServer(app);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, methods: ['GET', 'POST', 'PATCH'] },
});

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: '2mb' })); // signatures are base64 PNGs, keep a generous limit

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sessions', buildSessionsRouter(io));
app.use('/api/attendance', buildAttendanceRouter(io));

// Serve uploaded/public assets (login image)
const path = require('path');
app.use('/public', express.static(path.join(__dirname, 'public')));

// Sockets: clients join a room per session to receive rotating QR tokens
// and live attendance updates without polling.
io.on('connection', (socket) => {
  socket.on('join:session', (sessionId) => {
    socket.join(`session:${sessionId}`);
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
    if (session && session.status === 'active') {
      socket.emit('qr:update', { sessionId: session.id, ...currentToken(session.qr_secret, session.id) });
    }
  });

  socket.on('leave:session', (sessionId) => {
    socket.leave(`session:${sessionId}`);
  });
});

// Rotate & broadcast QR tokens for every active session on a fixed tick,
// so every connected CR display and every student in the room stays in sync.
setInterval(() => {
  const activeSessions = db.prepare(`SELECT * FROM sessions WHERE status = 'active'`).all();
  for (const session of activeSessions) {
    io.to(`session:${session.id}`).emit('qr:update', {
      sessionId: session.id,
      ...currentToken(session.qr_secret, session.id),
    });
  }
}, ROTATE_SECONDS * 1000);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`QR Attendance API + realtime server running on port ${PORT}`);
});
