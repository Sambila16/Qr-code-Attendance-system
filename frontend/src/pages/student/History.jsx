import { useEffect, useState } from 'react';
import client from '../../api/client';
import StatusPill from '../../components/StatusPill';

export default function History() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/attendance/mine').then(({ data }) => {
      setRows(data.attendance);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-1">My attendance history</h1>
      <p className="text-mist text-sm mb-6">Every session you've checked into.</p>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-mist text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Session</th>
              <th className="text-left px-4 py-3">Course unit</th>
              <th className="text-left px-4 py-3">Time</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center text-mist py-8">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-mist py-8">
                  You haven't marked any attendance yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium">{r.session_title}</td>
                  <td className="px-4 py-3 text-mist">{r.course_unit}</td>
                  <td className="px-4 py-3 text-mist">{new Date(r.marked_at + 'Z').toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={r.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
