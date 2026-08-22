import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../auth.jsx';
import { Field } from '../components/ui.jsx';

// Client-side validation mirrors the server rules for instant feedback.
function validate(f) {
  const e = {};
  if (!f.employee_code.trim()) e.employee_code = 'Employee ID is required';
  if (!f.name.trim()) e.name = 'Name is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email';
  if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password))
    e.password = 'Min 8 chars, with a letter and a number';
  if (f.password !== f.confirm) e.confirm = 'Passwords do not match';
  return e;
}

export default function Signup() {
  const { signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    employee_code: '', name: '', email: '', password: '', confirm: '', role: 'employee',
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      const u = await signup({
        employee_code: form.employee_code.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      toast.success(`Account created. Welcome, ${u.name.split(' ')[0]}!`);
      navigate('/');
    } catch (err) {
      // Show field errors from the server if there are any, else a toast.
      if (err.errors) setErrors(err.errors);
      else toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-hero">
        <img className="auth-logo" src="/genesis-logo.png" alt="Genesis" />
        <h2>Start your journey<br />with Genesis.</h2>
        <p>Set up your account in under a minute and manage your entire work life from one dashboard.</p>
      </div>

      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit} noValidate>
          <h1>Create account</h1>
          <p className="muted mb">Register with your company Employee ID.</p>

          <Field label="Employee ID" error={errors.employee_code}>
            <input className={`input ${errors.employee_code ? 'error' : ''}`} value={form.employee_code}
              onChange={set('employee_code')} placeholder="e.g. EMP013" />
          </Field>
          <Field label="Full name" error={errors.name}>
            <input className={`input ${errors.name ? 'error' : ''}`} value={form.name}
              onChange={set('name')} placeholder="Your name" />
          </Field>
          <Field label="Email" error={errors.email}>
            <input className={`input ${errors.email ? 'error' : ''}`} type="email" value={form.email}
              onChange={set('email')} placeholder="you@genesis.com" />
          </Field>
          <div className="grid grid-2">
            <Field label="Password" error={errors.password}>
              <input className={`input ${errors.password ? 'error' : ''}`} type="password" value={form.password}
                onChange={set('password')} placeholder="••••••••" />
            </Field>
            <Field label="Confirm" error={errors.confirm}>
              <input className={`input ${errors.confirm ? 'error' : ''}`} type="password" value={form.confirm}
                onChange={set('confirm')} placeholder="••••••••" />
            </Field>
          </div>
          <Field label="Role" hint="Choose HR/Admin only if you manage the team.">
            <select className="input" value={form.role} onChange={set('role')}>
              <option value="employee">Employee</option>
              <option value="admin">HR / Admin</option>
            </select>
          </Field>

          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </button>

          <p className="muted mt" style={{ textAlign: 'center' }}>
            Already registered? <Link to="/login" style={{ color: 'var(--brand-dark)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
