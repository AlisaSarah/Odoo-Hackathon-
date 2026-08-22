import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth, useToast } from '../auth.jsx';
import { Spinner, Field, Badge, money, formatDate } from '../components/ui.jsx';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [emp, setEmp] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  const load = () => api.get(`/employees/${user.id}`).then((d) => setEmp(d.employee)).catch(() => {});
  useEffect(() => { load(); }, []);
  if (!emp) return <Spinner />;

  const startEdit = () => {
    setForm({ phone: emp.phone || '', address: emp.address || '', dob: emp.dob || '', gender: emp.gender || '' });
    setEditing(true);
  };

  const save = async () => {
    setBusy(true);
    try {
      await api.put(`/employees/${user.id}`, form);
      toast.success('Profile updated');
      setEditing(false);
      await load();
      await refreshUser();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const InfoRow = ({ label, value }) => (
    <div className="row between" style={{ padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
      <span className="muted">{label}</span>
      <strong style={{ textAlign: 'right' }}>{value || '—'}</strong>
    </div>
  );

  return (
    <>
      <div className="page-head row between">
        <div><h1>My Profile</h1><p>Your personal and job details.</p></div>
        {!editing && <button className="btn btn-primary" onClick={startEdit}>✏️ Edit profile</button>}
      </div>

      {/* Header card */}
      <div className="card card-pad mb row" style={{ gap: 18 }}>
        <div className="avatar" style={{ width: 66, height: 66, fontSize: 26 }}>{emp.name[0].toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <div className="row" style={{ gap: 10 }}>
            <h2 style={{ fontSize: 20 }}>{emp.name}</h2>
            <Badge tone={emp.role === 'admin' ? 'blue' : 'gray'}>{emp.role === 'admin' ? 'HR / Admin' : 'Employee'}</Badge>
            <Badge>{emp.status}</Badge>
          </div>
          <div className="muted mt">{emp.designation || 'No designation set'} · {emp.department || 'No department'}</div>
          <div className="muted" style={{ fontSize: 13 }}>{emp.employee_code} · {emp.email}</div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Personal details / edit form */}
        <div className="card">
          <div className="card-head"><h3>Personal details</h3></div>
          <div className="card-pad">
            {!editing ? (
              <>
                <InfoRow label="Phone" value={emp.phone} />
                <InfoRow label="Address" value={emp.address} />
                <InfoRow label="Date of birth" value={emp.dob ? formatDate(emp.dob) : null} />
                <InfoRow label="Gender" value={emp.gender} />
              </>
            ) : (
              <>
                <Field label="Phone">
                  <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 …" />
                </Field>
                <Field label="Address">
                  <textarea className="input" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </Field>
                <div className="grid grid-2">
                  <Field label="Date of birth">
                    <input className="input" type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
                  </Field>
                  <Field label="Gender">
                    <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                      <option value="">Prefer not to say</option>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </Field>
                </div>
                <div className="row" style={{ gap: 10 }}>
                  <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save changes'}</button>
                  <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Job + compensation (read-only for employee) */}
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card">
            <div className="card-head"><h3>Job details</h3></div>
            <div className="card-pad">
              <InfoRow label="Department" value={emp.department} />
              <InfoRow label="Designation" value={emp.designation} />
              <InfoRow label="Date of joining" value={emp.date_of_joining ? formatDate(emp.date_of_joining) : null} />
            </div>
          </div>
          <div className="card">
            <div className="card-head"><h3>Salary structure</h3><Badge tone="gray">Monthly</Badge></div>
            <div className="card-pad">
              <InfoRow label="Basic" value={money(emp.basic_salary)} />
              <InfoRow label="HRA" value={money(emp.hra)} />
              <InfoRow label="Allowances" value={money(emp.allowances)} />
              <InfoRow label="Deductions" value={'– ' + money(emp.deductions)} />
              <div className="row between mt">
                <strong>Net (take-home)</strong>
                <strong style={{ color: 'var(--brand-dark)', fontSize: 18 }}>{money(emp.net)}</strong>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><h3>Documents</h3></div>
            <div className="card-pad" style={{ display: 'grid', gap: 8 }}>
              {(emp.documents || []).length === 0 && <span className="muted">No documents uploaded.</span>}
              {(emp.documents || []).map((doc, i) => (
                <div key={i} className="row between" style={{ padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 9 }}>
                  <span>📄 {typeof doc === 'string' ? doc : doc.name}</span>
                  <button className="btn btn-ghost btn-sm">View</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
