import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';

export default function StudentHome() {
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [activeRes, historyRes] = await Promise.all([
        client.get('/sessions/active'),
        client.get('/attendance/mine'),
      ]);
      setActiveSessions(activeRes.data.sessions);
      setHistory(historyRes.data.attendance);
      setLoading(false);
    }
    load();
  }, []);

  const flaggedCount = history.filter((h) => h.status === 'flagged').length;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Hi, {user?.full_name?.split(' ')[0]}</h1>
      <p className="text-mist text-sm mt-1">{user?.registration_number} · {user?.course}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-7">
        <StatCard label="Sessions attended" value={loading ? '—' : history.length} tone="accent" />
        <StatCard label="Live sessions now" value={loading ? '—' : activeSessions.length} />
        <StatCard
          label="Flagged records"
          value={loading ? '—' : flaggedCount}
          tone={flaggedCount > 0 ? 'danger' : 'default'}
        />
      </div>

      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold">Active sessions for your course</h2>
        </div>
        {loading ? (
          <p className="text-mist text-sm">Loading…</p>
        ) : activeSessions.length === 0 ? (
          <p className="text-mist text-sm py-4">No active session right now. Check back when your class starts.</p>
        ) : (
          <div className="space-y-2">
            {activeSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-ink/60 rounded-xl px-4 py-3">
                <div>
                  <p className="font-medium text-sm">{s.title}</p>
                  <p className="text-xs text-mist">
                    {s.course_unit} · opened by {s.created_by_name}
                  </p>
                </div>
                <Link to="/student/scan" className="btn-primary text-sm px-4 py-2">
                  Scan now
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link
        to="/student/scan"
        className="card p-6 flex items-center justify-between hover:bg-white/[0.03] transition"
      >
        <div>
          <p className="font-display font-semibold">Mark your attendance</p>
          <p className="text-sm text-mist mt-1">Scan the QR code shown by your class representative, then sign.</p>
        </div>
        <span className="text-accent text-2xl">→</span>
      </Link>
    </div>
  );
}
