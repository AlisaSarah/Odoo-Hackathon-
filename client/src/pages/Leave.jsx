import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth, useToast } from '../auth.jsx';
import { Spinner, Badge, EmptyState, Modal, Field, formatDate } from '../components/ui.jsx';

export default function Leave() {
  const { user } = useAuth();
  return user.role === 'admin' ? <LeaveApprovals /> : <MyLeave />;
}

/* ==================== EMPLOYEE ==================== */
function MyLeave() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ leave_type: 'paid', start_date: '', end_date: '', reason: '' });
  const [busy, setBusy] = useState(false);

  const load = () => api.get('/leave/me').then(setData).catch(() => {});
  useEffect(() => { load(); }, []);
  if (!data) return <Spinner />;

  const apply = async () => {
    if (!form.start_date || !form.end_date) return toast.error('Pick both dates');
    setBusy(true);
    try {
      await api.post('/leave', form);
      toast.success('Leave request submitted');
      setShowForm(false);
      setForm({ leave_type: 'paid', start_date: '', end_date: '', reason: '' });
      load();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <>
      <div className="page-head row between">
        <div><h1>My Leave</h1><p>Apply for time off and track your requests.</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Apply for leave</button>
      </div>

      <div className="grid grid-4 mb">
        {data.balances.filter((b) => b.leave_type !== 'unpaid').map((b) => (
          <div className="stat" key={b.leave_type}>
            <div className="stat-label" style={{ textTransform: 'capitalize' }}>{b.leave_type} leave</div>
            <div className="stat-value" style={{ fontSize: 26 }}>{b.total - b.used}
              <span className="muted" style={{ fontSize: 14, fontWeight: 500 }}> / {b.total}</span></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head"><h3>Request history</h3></div>
        {data.requests.length === 0 ? (
          <EmptyState icon="🌴" title="No leave requests yet" subtitle="Apply above when you need time off." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th><th>Note</th></tr></thead>
              <tbody>
                {data.requests.map((r) => (
                  <tr key={r.id}>
                    <td><Badge>{r.leave_type}</Badge></td>
                    <td>{formatDate(r.start_date)} → {formatDate(r.end_date)}</td>
                    <td>{r.days}</td>
                    <td className="muted">{r.reason || '—'}</td>
                    <td><Badge>{r.status}</Badge></td>
                    <td className="muted" style={{ fontSize: 13 }}>{r.admin_comment || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <Modal title="Apply for leave" onClose={() => setShowForm(false)}
          footer={<div className="row" style={{ gap: 10 }}>
            <button className="btn btn-primary" disabled={busy} onClick={apply}>{busy ? 'Submitting…' : 'Submit request'}</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>}>
          <Field label="Leave type">
            <select className="input" value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })}>
              <option value="paid">Paid leave</option>
              <option value="sick">Sick leave</option>
              <option value="casual">Casual leave</option>
              <option value="unpaid">Unpaid leave</option>
            </select>
          </Field>
          <div className="grid grid-2">
            <Field label="From"><input className="input" type="date" value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field>
            <Field label="To"><input className="input" type="date" value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></Field>
          </div>
          <Field label="Reason (optional)">
            <textarea className="input" rows={3} value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Add a short note for HR…" />
          </Field>
        </Modal>
      )}
    </>
  );
}

/* ==================== ADMIN ==================== */
function LeaveApprovals() {
  const toast = useToast();
  const [filter, setFilter] = useState('pending');
  const [requests, setRequests] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [review, setReview] = useState(null); // request being reviewed
  const [comment, setComment] = useState('');

  const load = () => {
    setRequests(null);
    setLoadError('');
    api.get(`/leave?status=${filter}`)
      .then((d) => setRequests(d.requests))
      .catch((e) => { setLoadError(e.message); setRequests([]); });
  };
  useEffect(() => { load(); }, [filter]);

  const decide = async (decision) => {
    try {
      await api.put(`/leave/${review.id}/review`, { decision, comment });
      toast.success(`Leave ${decision}`);
      setReview(null); setComment(''); load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <>
      <div className="page-head"><h1>Leave Approvals</h1><p>Review and act on team leave requests.</p></div>

      <div className="card">
        <div className="card-head">
          <div className="pill-tabs">
            {['pending', 'approved', 'rejected', ''].map((f) =>
              <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
                {f === '' ? 'All' : f[0].toUpperCase() + f.slice(1)}
              </button>)}
          </div>
        </div>
        {loadError ? (
          <div className="empty">
            <div className="empty-ico">⚠️</div>
            <div style={{ fontWeight: 700, color: 'var(--text)' }}>Could not load leave requests</div>
            <div style={{ marginTop: 4 }}>{loadError}</div>
            <button className="btn btn-ghost btn-sm mt" onClick={load}>Try again</button>
          </div>
        ) : !requests ? <Spinner /> : requests.length === 0 ? (
          <EmptyState icon="✅" title="Nothing here" subtitle="No requests match this filter." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.name}</strong><div className="muted" style={{ fontSize: 12 }}>{r.employee_code} · {r.department}</div></td>
                    <td><Badge>{r.leave_type}</Badge></td>
                    <td>{formatDate(r.start_date)} → {formatDate(r.end_date)}</td>
                    <td>{r.days}</td>
                    <td className="muted" style={{ maxWidth: 180 }}>{r.reason || '—'}</td>
                    <td><Badge>{r.status}</Badge></td>
                    <td style={{ textAlign: 'right' }}>
                      {r.status === 'pending'
                        ? <button className="btn btn-primary btn-sm" onClick={() => setReview(r)}>Review</button>
                        : <span className="muted" style={{ fontSize: 12 }}>{r.admin_comment || 'done'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {review && (
        <Modal title={`Review — ${review.name}`} onClose={() => { setReview(null); setComment(''); }}
          footer={<div className="row" style={{ gap: 10 }}>
            <button className="btn btn-primary" onClick={() => decide('approved')}>✓ Approve</button>
            <button className="btn btn-danger" onClick={() => decide('rejected')}>✕ Reject</button>
          </div>}>
          <div className="card card-pad mb" style={{ background: 'var(--surface-2)', border: 'none' }}>
            <div className="row between"><span className="muted">Type</span><Badge>{review.leave_type}</Badge></div>
            <div className="row between mt"><span className="muted">Dates</span><strong>{formatDate(review.start_date)} → {formatDate(review.end_date)}</strong></div>
            <div className="row between mt"><span className="muted">Days</span><strong>{review.days}</strong></div>
            {review.reason && <div className="mt"><span className="muted">Reason:</span> {review.reason}</div>}
          </div>
          <Field label="Comment (optional)">
            <textarea className="input" rows={2} value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="Add a note the employee will see…" />
          </Field>
        </Modal>
      )}
    </>
  );
}
