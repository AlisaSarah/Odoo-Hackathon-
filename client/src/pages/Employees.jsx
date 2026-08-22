import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useToast } from '../auth.jsx';
import { Spinner, Badge, EmptyState, Modal, Field, money, formatDate } from '../components/ui.jsx';

export default function Employees() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [dept, setDept] = useState('');
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null); // employee detail drawer
  const [adding, setAdding] = useState(false);
  const [newEmp, setNewEmp] = useState({ employee_code: '', name: '', email: '', department: '', designation: '' });

  const load = () => {
    const query = new URLSearchParams();
    if (q) query.set('q', q);
    if (dept) query.set('department', dept);
    api.get(`/employees?${query}`).then(setData).catch(() => {});
  };
  // Debounce search-as-you-type a little.
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [q, dept]);
  useEffect(() => { setParams(q ? { q } : {}); }, [q]);

  const addEmployee = async () => {
    try {
      await api.post('/employees', newEmp);
      toast.success('Employee added (temp password = Employee ID)');
      setAdding(false);
      setNewEmp({ employee_code: '', name: '', email: '', department: '', designation: '' });
      load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <>
      <div className="page-head row between wrap">
        <div><h1>Employees</h1><p>Your team directory.</p></div>
        <button className="btn btn-primary" onClick={() => setAdding(true)}>+ Add employee</button>
      </div>

      <div className="card">
        <div className="card-head row between wrap" style={{ gap: 10 }}>
          <input className="input" placeholder="Search by name, email, ID…" value={q}
            onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 320 }} />
          <select className="input" value={dept} onChange={(e) => setDept(e.target.value)} style={{ width: 'auto' }}>
            <option value="">All departments</option>
            {data?.departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {!data ? <Spinner /> : data.employees.length === 0 ? (
          <EmptyState icon="🔍" title="No employees found" subtitle="Try a different search or filter." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Department</th><th>Designation</th><th>Net salary</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {data.employees.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <div className="row" style={{ gap: 10 }}>
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: 13 }}>{e.name[0]}</div>
                        <div><strong>{e.name}</strong><div className="muted" style={{ fontSize: 12 }}>{e.employee_code} · {e.email}</div></div>
                      </div>
                    </td>
                    <td>{e.department || '—'}</td>
                    <td>{e.designation || '—'}</td>
                    <td>{money(e.net)}</td>
                    <td><Badge>{e.status}</Badge></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelected(e)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <EmployeeDetail emp={selected} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); load(); }} />}

      {adding && (
        <Modal title="Add new employee" onClose={() => setAdding(false)}
          footer={<div className="row" style={{ gap: 10 }}>
            <button className="btn btn-primary" onClick={addEmployee}>Add employee</button>
            <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
          </div>}>
          <div className="grid grid-2">
            <Field label="Employee ID"><input className="input" value={newEmp.employee_code}
              onChange={(e) => setNewEmp({ ...newEmp, employee_code: e.target.value })} placeholder="EMP013" /></Field>
            <Field label="Full name"><input className="input" value={newEmp.name}
              onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })} /></Field>
          </div>
          <Field label="Email"><input className="input" type="email" value={newEmp.email}
            onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })} /></Field>
          <div className="grid grid-2">
            <Field label="Department"><input className="input" value={newEmp.department}
              onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })} /></Field>
            <Field label="Designation"><input className="input" value={newEmp.designation}
              onChange={(e) => setNewEmp({ ...newEmp, designation: e.target.value })} /></Field>
          </div>
          <div className="hint">A temporary password (same as the Employee ID) is set automatically.</div>
        </Modal>
      )}
    </>
  );
}

// Admin can edit the full record here.
function EmployeeDetail({ emp, onClose, onSaved }) {
  const toast = useToast();
  const [full, setFull] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);

  useEffect(() => { api.get(`/employees/${emp.id}`).then((d) => { setFull(d.employee); setForm(d.employee); }).catch(() => {}); }, [emp.id]);

  const save = async () => {
    try {
      const fields = ['name', 'email', 'phone', 'department', 'designation', 'date_of_joining', 'status'];
      const payload = Object.fromEntries(fields.map((f) => [f, form[f]]));
      await api.put(`/employees/${emp.id}`, payload);
      toast.success('Employee updated');
      onSaved();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <Modal title={editing ? 'Edit employee' : full?.name || 'Employee'} onClose={onClose}
      footer={editing
        ? <div className="row" style={{ gap: 10 }}>
            <button className="btn btn-primary" onClick={save}>Save</button>
            <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        : <button className="btn btn-primary" onClick={() => setEditing(true)}>✏️ Edit details</button>}>
      {!full ? <Spinner /> : !editing ? (
        <>
          <div className="row mb" style={{ gap: 14 }}>
            <div className="avatar" style={{ width: 54, height: 54, fontSize: 22 }}>{full.name[0]}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{full.name}</div>
              <div className="muted" style={{ fontSize: 13 }}>{full.designation} · {full.department}</div>
            </div>
          </div>
          <DRow label="Employee ID" value={full.employee_code} />
          <DRow label="Email" value={full.email} />
          <DRow label="Phone" value={full.phone} />
          <DRow label="Joined" value={full.date_of_joining ? formatDate(full.date_of_joining) : '—'} />
          <DRow label="Net salary" value={money(full.net)} />
          <DRow label="Status" value={<Badge>{full.status}</Badge>} />
        </>
      ) : (
        <>
          <Field label="Name"><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email"><input className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <div className="grid grid-2">
            <Field label="Department"><input className="input" value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Field>
            <Field label="Designation"><input className="input" value={form.designation || ''} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></Field>
          </div>
          <div className="grid grid-2">
            <Field label="Phone"><input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Status">
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>
        </>
      )}
    </Modal>
  );
}

function DRow({ label, value }) {
  return (
    <div className="row between" style={{ padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
      <span className="muted">{label}</span><strong>{value || '—'}</strong>
    </div>
  );
}
