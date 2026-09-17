const crypto = require('crypto');

const ROTATE_SECONDS = parseInt(process.env.QR_ROTATE_SECONDS || '15', 10);
const VALID_WINDOW_SECONDS = parseInt(process.env.QR_VALID_WINDOW_SECONDS || '25', 10);

function slotFor(timestampSeconds) {
  return Math.floor(timestampSeconds / ROTATE_SECONDS);
}

function tokenForSlot(qrSecret, sessionId, slot) {
  return crypto
    .createHmac('sha256', qrSecret)
    .update(`${sessionId}:${slot}`)
    .digest('hex')
    .slice(0, 16);
}

// Generates the token that is valid *right now* for a session.
function currentToken(qrSecret, sessionId) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const slot = slotFor(nowSeconds);
  return {
    token: tokenForSlot(qrSecret, sessionId, slot),
    slot,
    rotateSeconds: ROTATE_SECONDS,
    expiresAt: (slot + 1) * ROTATE_SECONDS * 1000,
  };
}

// Verifies a submitted token against the current and immediately preceding
// slots, giving students a grace window to scan + sign before it rotates.
function verifyToken(qrSecret, sessionId, submittedToken) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const currentSlot = slotFor(nowSeconds);
  const slotsBack = Math.ceil(VALID_WINDOW_SECONDS / ROTATE_SECONDS);

  for (let i = 0; i <= slotsBack; i++) {
    const candidate = tokenForSlot(qrSecret, sessionId, currentSlot - i);
    if (candidate === submittedToken) return true;
  }
  return false;
}

module.exports = { currentToken, verifyToken, ROTATE_SECONDS, VALID_WINDOW_SECONDS };
