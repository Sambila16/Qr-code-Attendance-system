import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';

export default function Overview() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [sessionsRes, attendanceRes] = await Promise.all([
        client.get('/sessions'),
        client.get('/attendance'),
      ]);
      setSessions(sessionsRes.data.sessions);
      setAttendance(attendanceRes.data.attendance);
      setLoading(false);
    }
    load();
  }, []);

  const activeSessions = sessions.filter((s) => s.status === 'active');
  const flaggedCount = attendance.filter((a) => a.status === 'flagged').length;
  const today = new Date().toISOString().slice(0, 10);
  const markedToday = attendance.filter((a) => a.marked_at?.startsWith(today)).length;

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold">
            {user?.role === 'admin' ? 'Admin overview' : `Welcome back, ${user?.full_name?.split(' ')[0]}`}
          </h1>
          <p className="text-mist text-sm mt-1">
            {user?.course || 'All courses'} · Class representative dashboard
          </p>
        </div>
        <Link to="/cr/sessions" className="btn-primary">
          + New session
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active sessions" value={loading ? '—' : activeSessions.length} tone="accent" />
        <StatCard label="Marked today" value={loading ? '—' : markedToday} />
        <StatCard label="Total sessions" value={loading ? '—' : sessions.length} />
        <StatCard
          label="Flagged for review"
          value={loading ? '—' : flaggedCount}
          tone={flaggedCount > 0 ? 'danger' : 'default'}
          sub={flaggedCount > 0 ? 'Possible proxy attendance' : 'Nothing suspicious'}
        />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold">Recent sessions</h2>
          <Link to="/cr/sessions" className="text-sm text-accent hover:underline">
            View all
          </Link>
        </div>

        {loading ? (
          <p className="text-mist text-sm">Loading…</p>
        ) : sessions.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-mist text-sm mb-3">You haven't opened any attendance sessions yet.</p>
            <Link to="/cr/sessions" className="btn-primary inline-block">
              Start your first session
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {sessions.slice(0, 6).map((s) => (
              <Link
                key={s.id}
                to={`/cr/sessions/${s.id}`}
                className="flex items-center justify-between py-3 hover:bg-white/[0.03] -mx-2 px-2 rounded-lg transition"
              >
                <div>
                  <p className="font-medium text-sm">{s.title}</p>
                  <p className="text-xs text-mist">{s.course_unit}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-mist">{s.attendance_count} present</span>
                  <span
                    className={`pill ${
                      s.status === 'active' ? 'bg-accent/15 text-accent' : 'bg-white/10 text-mist'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
