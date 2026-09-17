import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import client from '../../api/client';
import { getSocket } from '../../api/socket';
import StatusPill from '../../components/StatusPill';

export default function SessionRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [qr, setQr] = useState(null);
  const [feed, setFeed] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [closing, setClosing] = useState(false);
  const tickRef = useRef(null);

  useEffect(() => {
    async function load() {
      const { data } = await client.get(`/sessions/${id}`);
      setSession(data.session);
      setQr(data.qr);
      const attendanceRes = await client.get(`/attendance?session_id=${id}`);
      setFeed(attendanceRes.data.attendance);
    }
    load();

    const socket = getSocket();
    socket.emit('join:session', id);

    const handleQrUpdate = (payload) => {
      if (String(payload.sessionId) === String(id)) setQr(payload);
    };
    const handleNewAttendance = (record) => {
      if (String(record.session_id) === String(id)) {
        setFeed((prev) => [record, ...prev]);
      }
    };
    const handleClosed = (payload) => {
      if (String(payload.sessionId) === String(id)) {
        setSession((s) => (s ? { ...s, status: 'closed' } : s));
        setQr(null);
      }
    };

    socket.on('qr:update', handleQrUpdate);
    socket.on('attendance:new', handleNewAttendance);
    socket.on('session:closed', handleClosed);

    return () => {
      socket.emit('leave:session', id);
      socket.off('qr:update', handleQrUpdate);
      socket.off('attendance:new', handleNewAttendance);
      socket.off('session:closed', handleClosed);
    };
  }, [id]);

  useEffect(() => {
    clearInterval(tickRef.current);
    if (!qr) {
      setSecondsLeft(null);
      return undefined;
    }
    tickRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((qr.expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
    }, 250);
    return () => clearInterval(tickRef.current);
  }, [qr]);

  async function handleClose() {
    setClosing(true);
    try {
      await client.patch(`/sessions/${id}/close`);
    } finally {
      setClosing(false);
    }
  }

  if (!session) return <p className="text-mist">Loading session…</p>;

  const qrPayload = qr ? JSON.stringify({ sessionId: session.id, token: qr.token }) : '';
  const validCount = feed.filter((f) => f.status === 'valid').length;
  const flaggedCount = feed.filter((f) => f.status === 'flagged').length;

  return (
    <div>
      <button onClick={() => navigate('/cr/sessions')} className="text-sm text-mist hover:text-white mb-4">
        ← Back to sessions
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">{session.title}</h1>
          <p className="text-mist text-sm mt-1">{session.course_unit}</p>
        </div>
        {session.status === 'active' ? (
          <button className="btn-danger" onClick={handleClose} disabled={closing}>
            {closing ? 'Closing…' : 'Close session'}
          </button>
        ) : (
          <span className="pill bg-white/10 text-mist">Closed</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 card p-6 flex flex-col items-center text-center">
          {session.status === 'active' && qr ? (
            <>
              <p className="text-xs font-medium text-mist uppercase tracking-wide mb-4">
                Display this to your class
              </p>
              <div className="bg-white rounded-2xl p-5">
                <QRCodeSVG value={qrPayload} size={220} bgColor="#ffffff" fgColor="#12172B" />
              </div>
              <p className="text-xs text-mist mt-4">
                Refreshes automatically every {qr.rotateSeconds}s
                {secondsLeft !== null && <> · next in {secondsLeft}s</>}
              </p>
              <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-200 ease-linear"
                  style={{
                    width: `${secondsLeft != null ? (secondsLeft / qr.rotateSeconds) * 100 : 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-mist mt-4 max-w-xs">
                The code rotates automatically so a screenshot can't be reused after class.
              </p>
            </>
          ) : (
            <p className="text-mist py-10">This session is closed. No new scans are accepted.</p>
          )}
        </div>

        <div className="lg:col-span-3 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold">Live attendance</h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-accent">{validCount} valid</span>
              {flaggedCount > 0 && <span className="text-danger">{flaggedCount} flagged</span>}
            </div>
          </div>

          {feed.length === 0 ? (
            <p className="text-mist text-sm py-8 text-center">
              Waiting for students to scan and sign in…
            </p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {feed.map((f) => (
                <div key={f.id} className="flex items-center justify-between bg-ink/60 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    {f.signature && (
                      <img
                        src={f.signature}
                        alt="signature"
                        className="w-14 h-8 object-contain bg-white rounded"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium">{f.full_name}</p>
                      <p className="text-xs text-mist">{f.registration_number}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusPill status={f.status} />
                    <p className="text-[11px] text-mist mt-1">
                      {new Date(f.marked_at + 'Z').toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
