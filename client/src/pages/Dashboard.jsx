import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import { api } from '../api.js';
import { useAuth, useToast } from '../auth.jsx';
import { StatCard, Badge, Spinner, EmptyState } from '../components/ui.jsx';

const PIE_COLORS = ['#14b8a6', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#64748b'];

export default function Dashboard() {
  const { user } = useAuth();
  return user.role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />;
}

/* ==================== ADMIN ==================== */
function AdminDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { api.get('/dashboard/admin').then(setData).catch(() => {}); }, []);
  if (!data) return <Spinner />;

  const { stats, byDepartment, trend, recentLeaves } = data;

  return (
    <>
      <div className="page-head">
        <h1>HR Dashboard</h1>
        <p>A live snapshot of your organisation today.</p>
      </div>

      <div className="grid grid-4 mb">
        <StatCard label="Total Employees" value={stats.totalEmployees} icon="👥" tone="brand" />
        <StatCard label="Present Today" value={stats.presentToday} icon="✅" tone="green" />
        <StatCard label="On Leave" value={stats.onLeaveToday} icon="🌴" tone="blue" />
        <StatCard label="Pending Approvals" value={stats.pendingLeaves} icon="⏳" tone="amber" />
      </div>

      <div className="grid grid-2 mb" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        <div className="card">
          <div className="card-head"><h3>Attendance — last 7 days</h3>
            <Badge tone="green">{stats.attendanceRate}% today</Badge></div>
          <div className="card-pad">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' }} />
                <Area type="monotone" dataKey="present" stroke="#14b8a6" strokeWidth={2.5} fill="url(#g)" name="Present" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>By Department</h3></div>
          <div className="card-pad">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byDepartment} dataKey="count" nameKey="department" cx="50%" cy="50%"
                  innerRadius={48} outerRadius={80} paddingAngle={2}>
                  {byDepartment.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt" style={{ display: 'grid', gap: 6 }}>
              {byDepartment.map((d, i) => (
                <div key={d.department} className="row between" style={{ fontSize: 13 }}>
                  <span className="row" style={{ gap: 7 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {d.department}
                  </span>
                  <strong>{d.count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Pending leave requests</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/leave')}>Review all →</button></div>
        {recentLeaves.length === 0 ? (
          <EmptyState icon="🎉" title="No pending requests" subtitle="You're all caught up." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days</th><th></th></tr></thead>
              <tbody>
                {recentLeaves.map((l) => (
                  <tr key={l.id}>
                    <td><strong>{l.name}</strong><div className="muted" style={{ fontSize: 12 }}>{l.employee_code}</div></td>
                    <td><Badge>{l.leave_type}</Badge></td>
                    <td>{l.start_date} → {l.end_date}</td>
                    <td>{l.days}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/leave')}>Review</button>
                    </td>
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

/* ==================== EMPLOYEE ==================== */
function EmployeeDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => api.get('/dashboard/employee').then(setData).catch(() => {});
  useEffect(() => { load(); }, []);
  if (!data) return <Spinner />;

  const { attendanceToday, stats, balances, activity } = data;
  const checkedIn = attendanceToday?.check_in;
  const checkedOut = attendanceToday?.check_out;

  const action = async (path) => {
    setBusy(true);
    try {
      const d = await api.post(`/attendance/${path}`);
      toast.success(d.message + (d.check_in ? ` at ${d.check_in}` : d.check_out ? ` at ${d.check_out}` : ''));
      load();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <>
      <div className="page-head">
        <h1>Hi {user.name.split(' ')[0]} 👋</h1>
        <p>Here's your day at a glance.</p>
      </div>

      <div className="card card-pad mb row between wrap" style={{ gap: 16 }}>
        <div>
          <div className="stat-label">Today's status</div>
          <div className="row mt" style={{ gap: 10 }}>
            {checkedIn ? <Badge tone="green">Checked in · {checkedIn}</Badge> : <Badge tone="gray">Not checked in</Badge>}
            {checkedOut && <Badge tone="blue">Checked out · {checkedOut}</Badge>}
          </div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <button className="btn btn-primary" disabled={busy || checkedIn} onClick={() => action('check-in')}>🟢 Check in</button>
          <button className="btn btn-ghost" disabled={busy || !checkedIn || checkedOut} onClick={() => action('check-out')}>🔴 Check out</button>
        </div>
      </div>

      <div className="grid grid-3 mb">
        <StatCard label="Present this month" value={stats.presentThisMonth} icon="📅" tone="green" />
        <StatCard label="Leave balance" value={`${stats.leaveBalance} days`} icon="🌴" tone="brand" />
        <StatCard label="Pending requests" value={stats.pendingLeaves} icon="⏳" tone="amber" />
      </div>

      <div className="grid grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <div className="card-head"><h3>Leave balances</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/leave')}>Apply →</button></div>
          <div className="card-pad" style={{ display: 'grid', gap: 14 }}>
            {balances.filter((b) => b.leave_type !== 'unpaid').map((b) => {
              const left = b.total - b.used;
              const pct = b.total ? (left / b.total) * 100 : 0;
              return (
                <div key={b.leave_type}>
                  <div className="row between" style={{ fontSize: 13, marginBottom: 6 }}>
                    <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{b.leave_type}</span>
                    <span className="muted">{left} / {b.total} left</span>
                  </div>
                  <div className="progress"><span style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Recent activity</h3></div>
          {activity.length === 0 ? (
            <EmptyState icon="📝" title="Nothing yet" subtitle="Your actions will show up here." />
          ) : (
            <div className="card-pad" style={{ display: 'grid', gap: 12 }}>
              {activity.map((a, i) => (
                <div key={i} className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ marginTop: 3 }}>•</span>
                  <div>
                    <div style={{ fontSize: 13.5 }}>{a.action}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{new Date(a.created_at).toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
