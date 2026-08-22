import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../auth.jsx';
import { Field } from '../components/ui.jsx';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}!`);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // Fills in demo credentials so judges can get in with one click.
  const demo = (email, password) => setForm({ email, password });

  return (
    <div className="auth">
      <div className="auth-hero">
        <div className="brand" style={{ padding: 0, marginBottom: 30 }}>
          <div className="brand-mark" style={{ background: 'rgba(255,255,255,0.2)' }}>D</div>
          <div className="brand-name" style={{ color: '#fff' }}>Dayflow</div>
        </div>
        <h2>Every workday,<br />perfectly aligned.</h2>
        <p>One place for attendance, leave, payroll and your whole team — built for people, not paperwork.</p>
        <ul>
          <li>✓ Smart attendance with one-tap check-in</li>
          <li>✓ Leave requests approved in seconds</li>
          <li>✓ Payslips and salary details, always at hand</li>
        </ul>
      </div>

      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <h1>Sign in</h1>
          <p className="muted mb">Welcome back — let's get you to work.</p>

          {error && <div className="toast error" style={{ marginBottom: 14 }}>{error}</div>}

          <Field label="Email">
            <input className="input" type="email" autoFocus value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@dayflow.com" />
          </Field>
          <Field label="Password">
            <input className="input" type="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••" />
          </Field>

          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="muted mt" style={{ textAlign: 'center' }}>
            No account? <Link to="/signup" style={{ color: 'var(--brand-dark)', fontWeight: 600 }}>Create one</Link>
          </p>

          <div className="card card-pad mt" style={{ background: 'var(--surface-2)', border: 'none' }}>
            <div className="stat-label mb">Demo logins</div>
            <div className="row between">
              <span className="muted">Admin / HR</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => demo('admin@dayflow.com', 'Admin@123')}>Use</button>
            </div>
            <div className="row between mt">
              <span className="muted">Employee</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => demo('aarav@dayflow.com', 'Pass@123')}>Use</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
