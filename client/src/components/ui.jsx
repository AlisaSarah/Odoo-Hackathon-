// Small reusable building blocks used across every page.

export function Spinner() {
  return <div className="center-screen"><div className="spinner" /></div>;
}

export function StatCard({ label, value, icon, tone = 'brand' }) {
  const bg = {
    brand: 'var(--brand-soft)', green: 'var(--green-soft)',
    amber: 'var(--amber-soft)', blue: 'var(--blue-soft)', red: 'var(--red-soft)',
  }[tone];
  const color = {
    brand: 'var(--brand-dark)', green: 'var(--green)',
    amber: 'var(--amber)', blue: 'var(--blue)', red: 'var(--red)',
  }[tone];
  return (
    <div className="stat">
      <div className="row between">
        <div>
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value}</div>
        </div>
        <div className="stat-icon" style={{ background: bg, color }}>{icon}</div>
      </div>
    </div>
  );
}

// Maps a status string to a coloured badge.
const STATUS_TONE = {
  present: 'green', approved: 'green', paid: 'green', active: 'green',
  pending: 'amber', 'half-day': 'amber',
  absent: 'red', rejected: 'red', inactive: 'red', unpaid: 'gray',
  leave: 'blue', sick: 'blue', casual: 'blue',
};
export function Badge({ children, tone }) {
  const t = tone || STATUS_TONE[String(children).toLowerCase()] || 'gray';
  return <span className={`badge badge-${t}`}>{children}</span>;
}

export function EmptyState({ icon = '📭', title, subtitle }) {
  return (
    <div className="empty">
      <div className="empty-ico">{icon}</div>
      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{title}</div>
      {subtitle && <div style={{ marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}

export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="card-pad">{children}</div>
        {footer && <div className="card-pad" style={{ paddingTop: 0 }}>{footer}</div>}
      </div>
    </div>
  );
}

// Text/select/number field with inline error support.
export function Field({ label, error, hint, children }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
      {error && <div className="field-error">{error}</div>}
      {hint && !error && <div className="hint">{hint}</div>}
    </div>
  );
}

export const money = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export const formatDate = (s) =>
  s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
