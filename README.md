# Presence - QR Code Attendance System

A full-stack attendance system for a Class Representative (CR) to run live
attendance sessions with a rotating QR code, student signatures, and
automatic detection of shared-device (proxy) attendance attempts.

## How it works

1. The CR opens a **session** for a lecture — this generates a QR code.
2. The QR code **rotates every 15 seconds**, so a screenshot shared in a
   group chat stops working almost immediately.
3. Students scan the code with their phone camera, then **sign** on-screen
   to confirm they are physically present.
4. The backend checks the device that submitted the scan. If the **same
   phone/browser** is used to check in a second, different student in the
   same session, **both** records are automatically flagged for review —
   this is the classic "one person taps in for a friend" cheat.
5. The CR (or admin) can filter, search, print or export attendance to CSV
   at any time.

Login uses a **registration number + password** — no email required.

## Tech stack

- **Backend**: Node.js, Express, Socket.IO (realtime), SQLite
  (better-sqlite3), JWT auth, bcrypt password hashing.
- **Frontend**: React (Vite), React Router, Tailwind CSS, Socket.IO client,
  `html5-qrcode` for the camera scanner, `qrcode.react` to render the QR,
  `react-signature-canvas` for signatures.

## Project structure

```
qr-attendance-system/
├── backend/
│   ├── db/            # SQLite schema (init.js) + sample data (seed.js)
│   ├── middleware/     # JWT auth + role guard
│   ├── routes/         # auth, sessions, attendance
│   ├── utils/qr.js      # rotating-QR token generation/verification
│   └── server.js
└── frontend/
    └── src/
        ├── pages/cr/         # CR/admin dashboard, session room, review
        ├── pages/student/    # student home, scan+sign, history
        ├── components/
        └── context/AuthContext.jsx
```

## Running it locally

You'll need Node.js 18+ installed.

### 1. Backend

```bash
cd backend
     # edit JWT_SECRET before real use
npm install
npm run seed               # creates sample accounts (see below)
npm start                  # runs on http://localhost:4000
```

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev                 # runs on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

### Sample login accounts (from `npm run seed`)

| Role    | Registration number | Password    |
|---------|----------------------|-------------|
| Admin   | `ADM-0001`           | `admin123`  |
| CR      | `CR-2023-001`         | `cr12345`   |
| Student | `T21-03-12345`        | `student123`|
| Student | `T21-03-12346`        | `student123`|
| Student | `T21-03-12347`        | `student123`|

Change these before deploying — the seed script is for demo/testing only.

## Trying the anti-cheat detection

1. Log in as the CR, create a session, and keep that browser tab open on
   the session room (this is where the live QR is shown).
2. Open a **second browser** (or an incognito window) and log in as
   Student 1 (`T21-03-12345`). Use the in-app camera scanner, or — since
   scanning a screen-to-screen QR from a laptop webcam can be fiddly while
   testing - you can hit the API directly (see below) to simulate a scan.
3. From that *same* browser/incognito window, log out and log back in as
   Student 2 (`T21-03-12346`), then submit attendance again. Because the
   device fingerprint is unchanged, both records will be marked
   `flagged` and show up in red on the CR's review page — with a note
   explaining which two students shared a device.
4. Also cr is able to upload, and update the image of student login page  to preserve
   and give a good visual impresion on the page, by ensuring
   registration of all student in the system  

## Notes on the anti-cheat design

- **Rotating QR** (`QR_ROTATE_SECONDS` in `.env`, default 15s): the code
  encodes a short-lived HMAC token tied to the session; scans older than
  `QR_VALID_WINDOW_SECONDS` are rejected with a clear "code expired"
  message.
- **One scan per student per session**: enforced at the database level
  (`UNIQUE(session_id, student_id)`), so re-submitting is blocked outright.
- **Device fingerprinting**: a lightweight, non-invasive fingerprint
  (canvas + browser/OS signals) is generated client-side and stored in
  `localStorage`, so the same physical device is recognized across logins.
  It isn't foolproof against a determined attacker who wipes storage
  between scans, but it stops the common "pass the phone around" case.
- **Signatures are required**: attendance without a signature is rejected
  by the API, and every signature is stored for the CR to review alongside
  the record.

## Deploying

- Swap SQLite for Postgres/MySQL by replacing `backend/db/init.js` if you
  need multi-server deployment (SQLite is fine for a single Node process).
- Put the frontend behind a static host (Vercel/Netlify) and the backend
  on any Node host (Render/Railway/a VPS); set `VITE_API_URL` in the
  frontend's environment to point at your backend URL, and update
  `CLIENT_ORIGIN` in the backend's `.env` to match your frontend's origin.
- Always change `JWT_SECRET` to a long random value in production, and
  serve the app over HTTPS — camera access for QR scanning requires a
  secure context on real devices.
