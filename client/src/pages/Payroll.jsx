import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth, useToast } from '../auth.jsx';
import { Spinner, Badge, EmptyState, Modal, Field, money } from '../components/ui.jsx';

export default function Payroll() {
  const { user } = useAuth();
  return user.role === 'admin' ? <AdminPayroll /> : <MyPayroll />;
}

/* ==================== EMPLOYEE ==================== */
function MyPayroll() {
  const [data, setData] = useState(null);
  const [slip, setSlip] = useState(null);

  useEffect(() => { api.get('/payroll/me').then(setData).catch(() => {}); }, []);
  if (!data) return <Spinner />;
  const s = data.structure;

  return (
    <>
      <div className="page-head"><h1>My Payroll</h1><p>Your salary breakdown and payslips (read-only).</p></div>

      <div className="grid grid-2 mb" style={{ gridTemplateColumns: '1fr 1.4fr' }}>
        <div className="card">
          <div className="card-head"><h3>Take-home</h3><Badge tone="gray">Monthly</Badge></div>
          <div className="card-pad">
            <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--brand-dark)' }}>{money(s.net)}</div>
            <div className="muted">per month, after deductions</div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Salary structure</h3></div>
          <div className="card-pad">
            <Row label="Basic salary" value={money(s.basic_salary)} />
            <Row label="House Rent Allowance" value={money(s.hra)} />
            <Row label="Other allowances" value={money(s.allowances)} />
            <Row label="Gross" value={money(s.gross)} bold />
            <Row label="Deductions (PF, tax)" value={'– ' + money(s.deductions)} />
            <Row label="Net pay" value={money(s.net)} bold accent />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Payslips</h3></div>
        {data.payslips.length === 0 ? (
          <EmptyState icon="🧾" title="No payslips yet" subtitle="They'll appear here once HR generates them." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Period</th><th>Gross</th><th>Deductions</th><th>Net pay</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {data.payslips.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.month_name} {p.year}</strong></td>
                    <td>{money(p.basic + p.hra + p.allowances)}</td>
                    <td>– {money(p.deductions)}</td>
                    <td><strong>{money(p.net_pay)}</strong></td>
                    <td><Badge>{p.status}</Badge></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSlip(p)}>View slip</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {slip && <Payslip slip={slip} name={data.structure.name} onClose={() => setSlip(null)} />}
    </>
  );
}

// A printable-looking salary slip.
function Payslip({ slip, onClose }) {
  const gross = slip.basic + slip.hra + slip.allowances;
  return (
    <Modal title={`Payslip — ${slip.month_name} ${slip.year}`} onClose={onClose}
      footer={<button className="btn btn-ghost" onClick={() => window.print()}>🖨 Print / Save PDF</button>}>
      <div className="row between mb">
        <div><div className="brand-name">Dayflow</div><div className="muted" style={{ fontSize: 12 }}>Salary Slip</div></div>
        <Badge tone="green">{slip.status}</Badge>
      </div>
      <Row label="Basic" value={money(slip.basic)} />
      <Row label="HRA" value={money(slip.hra)} />
      <Row label="Allowances" value={money(slip.allowances)} />
      <Row label="Gross earnings" value={money(gross)} bold />
      <Row label="Deductions" value={'– ' + money(slip.deductions)} />
      <Row label="Net pay" value={money(slip.net_pay)} bold accent />
    </Modal>
  );
}

/* ==================== ADMIN ==================== */
function AdminPayroll() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({});

  const load = () => api.get('/payroll').then(setData).catch(() => {});
  useEffect(() => { load(); }, []);
  if (!data) return <Spinner />;

  const openEdit = (e) => {
    setForm({ basic_salary: e.basic_salary, hra: e.hra, allowances: e.allowances, deductions: e.deductions });
    setEdit(e);
  };
  const save = async () => {
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, Number(v)]));
      await api.put(`/payroll/${edit.id}`, payload);
      toast.success('Salary updated'); setEdit(null); load();
    } catch (e) { toast.error(e.message); }
  };
  const generate = async (id, name) => {
    try { await api.post(`/payroll/${id}/generate`, {}); toast.success(`Payslip generated for ${name}`); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <>
      <div className="page-head"><h1>Payroll</h1><p>Manage salaries and generate payslips.</p></div>

      <div className="grid grid-3 mb">
        <div className="stat"><div className="stat-label">Employees on payroll</div><div className="stat-value" style={{ fontSize: 26 }}>{data.employees.length}</div></div>
        <div className="stat"><div className="stat-label">Total monthly payout</div><div className="stat-value" style={{ fontSize: 26, color: 'var(--brand-dark)' }}>{money(data.totalMonthly)}</div></div>
        <div className="stat"><div className="stat-label">Avg. net salary</div><div className="stat-value" style={{ fontSize: 26 }}>{money(data.totalMonthly / (data.employees.length || 1))}</div></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Salary sheet</h3></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Employee</th><th>Basic</th><th>HRA</th><th>Allow.</th><th>Deduct.</th><th>Net</th><th></th></tr></thead>
            <tbody>
              {data.employees.map((e) => (
                <tr key={e.id}>
                  <td><strong>{e.name}</strong><div className="muted" style={{ fontSize: 12 }}>{e.employee_code} · {e.department}</div></td>
                  <td>{money(e.basic_salary)}</td>
                  <td>{money(e.hra)}</td>
                  <td>{money(e.allowances)}</td>
                  <td>– {money(e.deductions)}</td>
                  <td><strong>{money(e.net)}</strong></td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(e)}>Edit</button>{' '}
                    <button className="btn btn-ghost btn-sm" onClick={() => generate(e.id, e.name)}>🧾 Payslip</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {edit && (
        <Modal title={`Edit salary — ${edit.name}`} onClose={() => setEdit(null)}
          footer={<div className="row" style={{ gap: 10 }}>
            <button className="btn btn-primary" onClick={save}>Save</button>
            <button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
          </div>}>
          {['basic_salary', 'hra', 'allowances', 'deductions'].map((k) => (
            <Field key={k} label={k.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}>
              <input className="input" type="number" min="0" value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </Field>
          ))}
          <div className="row between mt">
            <span className="muted">New net pay</span>
            <strong style={{ color: 'var(--brand-dark)' }}>
              {money((Number(form.basic_salary) + Number(form.hra) + Number(form.allowances)) - Number(form.deductions))}
            </strong>
          </div>
        </Modal>
      )}
    </>
  );
}

function Row({ label, value, bold, accent }) {
  return (
    <div className="row between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span className={bold ? '' : 'muted'} style={{ fontWeight: bold ? 700 : 400 }}>{label}</span>
      <strong style={{ color: accent ? 'var(--brand-dark)' : 'var(--text)', fontSize: accent ? 17 : 14 }}>{value}</strong>
    </div>
  );
}
