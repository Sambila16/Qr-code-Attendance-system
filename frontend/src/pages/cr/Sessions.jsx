import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../../api/client';

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [courseUnit, setCourseUnit] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function load() {
    const { data } = await client.get('/sessions');
    setSessions(data.sessions);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      const { data } = await client.post('/sessions', { title, course_unit: courseUnit });
      navigate(`/cr/sessions/${data.session.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create session');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Sessions</h1>
          <p className="text-mist text-sm mt-1">Open a new session to generate a live attendance QR code.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ New session'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-5 mb-6 space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-medium text-mist mb-1.5">Session title</label>
            <input
              className="input-field"
              placeholder="e.g. Week 6 Lecture — Database Systems"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-mist mb-1.5">Course unit</label>
            <input
              className="input-field"
              placeholder="e.g. Information Systems Management"
              value={courseUnit}
              onChange={(e) => setCourseUnit(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button className="btn-primary" disabled={creating}>
            {creating ? 'Creating…' : 'Generate QR code'}
          </button>
        </form>
      )}

      <div className="card divide-y divide-white/5">
        {loading ? (
          <p className="text-mist text-sm p-5">Loading…</p>
        ) : sessions.length === 0 ? (
          <p className="text-mist text-sm p-5">No sessions yet.</p>
        ) : (
          sessions.map((s) => (
            <Link
              key={s.id}
              to={`/cr/sessions/${s.id}`}
              className="flex items-center justify-between p-4 hover:bg-white/[0.03] transition"
            >
              <div>
                <p className="font-medium text-sm">{s.title}</p>
                <p className="text-xs text-mist">
                  {s.course_unit} · {new Date(s.starts_at).toLocaleString()}
                </p>
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
          ))
        )}
      </div>
    </div>
  );
}
