import { useEffect, useState } from 'react';
import client, { API_BASE_URL } from '../../api/client';
import StatusPill from '../../components/StatusPill';

export default function Review() {
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/sessions').then(({ data }) => setSessions(data.sessions));
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (sessionId) params.set('session_id', sessionId);
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      const { data } = await client.get(`/attendance?${params.toString()}`);
      setRows(data.attendance);
      setLoading(false);
    }
    load();
  }, [sessionId, status, search]);

  function exportCsv() {
    const params = new URLSearchParams();
    if (sessionId) params.set('session_id', sessionId);
    const token = localStorage.getItem('presence_token');
    const url = `${API_BASE_URL}/api/attendance/export.csv?${params.toString()}`;
    // Attach the token via a temporary fetch-and-download so the request is authenticated.
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'attendance-export.csv';
        link.click();
      });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="font-display text-2xl font-semibold">Review & export</h1>
          <p className="text-mist text-sm mt-1">Filter records, spot flagged attempts, export or print.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary" onClick={() => window.print()}>
            Print
          </button>
          <button className="btn-primary" onClick={exportCsv}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="card p-4 mb-5 flex flex-wrap gap-3 print:hidden">
        <select className="input-field w-auto" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
          <option value="">All sessions</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
        <select className="input-field w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="valid">Valid only</option>
          <option value="flagged">Flagged only</option>
        </select>
        <input
          className="input-field w-auto flex-1 min-w-[200px]"
          placeholder="Search name or registration number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-mist text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Student</th>
              <th className="text-left px-4 py-3">Session</th>
              <th className="text-left px-4 py-3">Time</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center text-mist py-8">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-mist py-8">
                  No matching records.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.full_name}</p>
                    <p className="text-xs text-mist">{r.registration_number}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{r.session_title}</p>
                    <p className="text-xs text-mist">{r.course_unit}</p>
                  </td>
                  <td className="px-4 py-3 text-mist">{new Date(r.marked_at + 'Z').toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-mist max-w-xs">{r.flag_reason || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
