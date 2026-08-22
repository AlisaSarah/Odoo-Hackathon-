import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth, useToast } from '../auth.jsx';
import { Spinner, Badge, EmptyState } from '../components/ui.jsx';

export default function Attendance() {
  const { user } = useAuth();
  return user.role === 'admin' ? <AdminAttendance /> : <MyAttendance />;
}

// Helpers to build date ranges for the range filter.
const iso = (d) => d.toISOString().slice(0, 10);
function rangeFor(view) {
  const to = new Date();
  const from = new Date();
  if (view === 'week') from.setDate(to.getDate() - 6);
  else if (view === 'month') from.setDate(to.getDate() - 29);
  else from.setDate(to.getDate() - 89); // "all" ~ last 90 days
  return { from: iso(from), to: iso(to) };
}

/* ==================== EMPLOYEE ==================== */
function MyAttendance() {
  const toast = useToast();
  const [view, setView] = useState('week');
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    const { from, to } = rangeFor(view);
    api.get(`/attendance/me?from=${from}&to=${to}`).then(setData).catch(() => {});
  };
  useEffect(() => { load(); }, [view]);
  if (!data) return <Spinner />;

  const summary = data.records.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
  const checkedIn = data.today?.check_in;
  const checkedOut = data.today?.check_out;

  const act = async (path) => {
    setBusy(true);
    try { const d = await api.post(`/attendance/${path}`); toast.success(d.message); load(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const exportCsv = () => downloadCsv(
    ['Date', 'Check in', 'Check out', 'Hours', 'Status'],
    data.records.map((r) => [r.date, r.check_in || '', r.check_out || '', r.work_hours || 0, r.status]),
    'my-attendance.csv'
  );

  return (
    <>
      <div className="page-head row between wrap">
        <div><h1>My Attendance</h1><p>Track your check-ins and history.</p></div>
        <div className="row" style={{ gap: 10 }}>
          <button className="btn btn-primary" disabled={busy || checkedIn} onClick={() => act('check-in')}>🟢 Check in</button>
          <button className="btn btn-ghost" disabled={busy || !checkedIn || checkedOut} onClick={() => act('check-out')}>🔴 Check out</button>
        </div>
      </div>

      <div className="grid grid-4 mb">
        <SummaryStat label="Present" value={summary.present || 0} tone="green" />
        <SummaryStat label="Half-days" value={summary['half-day'] || 0} tone="amber" />
        <SummaryStat label="On leave" value={summary.leave || 0} tone="blue" />
        <SummaryStat label="Absent" value={summary.absent || 0} tone="red" />
      </div>

      <div className="card">
        <div className="card-head">
          <div className="pill-tabs">
            {['week', 'month', 'all'].map((v) =>
              <button key={v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>
                {v === 'all' ? 'Last 90d' : v === 'week' ? 'This week' : 'This month'}
              </button>)}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={exportCsv}>⬇ Export CSV</button>
        </div>
        {data.records.length === 0 ? (
          <EmptyState icon="🕑" title="No records in this range" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Check in</th><th>Check out</th><th>Hours</th><th>Status</th></tr></thead>
              <tbody>
                {data.records.map((r) => (
                  <tr key={r.date}>
                    <td>{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                    <td>{r.check_in || '—'}</td>
                    <td>{r.check_out || '—'}</td>
                    <td>{r.work_hours ? `${r.work_hours}h` : '—'}</td>
                    <td><Badge>{r.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

/* ==================== ADMIN ==================== */
function AdminAttendance() {
  const toast = useToast();
  const [date, setDate] = useState(iso(new Date()));
  const [data, setData] = useState(null);

  const load = () => api.get(`/attendance?date=${date}`).then(setData).catch(() => {});
  useEffect(() => { load(); }, [date]);

  const mark = async (employee_id, status) => {
    try { await api.put('/attendance/mark', { employee_id, date, status }); toast.success('Updated'); load(); }
    catch (e) { toast.error(e.message); }
  };

  const exportCsv = () => data && downloadCsv(
    ['Employee', 'Code', 'Department', 'Check in', 'Check out', 'Status'],
    data.records.map((r) => [r.name, r.employee_code, r.department || '', r.check_in || '', r.check_out || '', r.status || 'not marked']),
    `attendance-${date}.csv`
  );

  if (!data) return <Spinner />;
  const present = data.records.filter((r) => r.status === 'present' || r.status === 'half-day').length;

  return (
    <>
      <div className="page-head"><h1>Team Attendance</h1><p>See and adjust attendance for any day.</p></div>

      <div className="card">
        <div className="card-head row between wrap" style={{ gap: 10 }}>
          <div className="row" style={{ gap: 12 }}>
            <input className="input" type="date" value={date} max={iso(new Date())}
              onChange={(e) => setDate(e.target.value)} style={{ width: 'auto' }} />
            <Badge tone="green">{present}/{data.records.length} present</Badge>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={exportCsv}>⬇ Export CSV</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Employee</th><th>Department</th><th>Check in</th><th>Check out</th><th>Status</th><th>Quick mark</th></tr></thead>
            <tbody>
              {data.records.map((r) => (
                <tr key={r.employee_id}>
                  <td><strong>{r.name}</strong><div className="muted" style={{ fontSize: 12 }}>{r.employee_code}</div></td>
                  <td>{r.department || '—'}</td>
                  <td>{r.check_in || '—'}</td>
                  <td>{r.check_out || '—'}</td>
                  <td>{r.status ? <Badge>{r.status}</Badge> : <Badge tone="gray">not marked</Badge>}</td>
                  <td>
                    <select className="input" style={{ width: 'auto', padding: '6px 10px' }}
                      value={r.status || ''} onChange={(e) => mark(r.employee_id, e.target.value)}>
                      <option value="" disabled>Set…</option>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="half-day">Half-day</option>
                      <option value="leave">Leave</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function SummaryStat({ label, value, tone }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ fontSize: 26 }}>
        {value} <span style={{ fontSize: 13 }}><Badge tone={tone}>days</Badge></span>
      </div>
    </div>
  );
}

// Turns rows into a CSV file and triggers a download — no library needed.
function downloadCsv(headers, rows, filename) {
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
