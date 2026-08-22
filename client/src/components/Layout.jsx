import { useEffect, useState } from 'react';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, useTheme } from '../auth.jsx';
import { api } from '../api.js';

// Nav links differ by role. `end` avoids the dashboard link staying active everywhere.
const EMPLOYEE_NAV = [
  { to: '/', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/profile', label: 'My Profile', icon: '👤' },
  { to: '/attendance', label: 'Attendance', icon: '🕑' },
  { to: '/leave', label: 'Leave', icon: '🌴' },
  { to: '/payroll', label: 'Payroll', icon: '💰' },
];
const ADMIN_NAV = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/employees', label: 'Employees', icon: '👥' },
  { to: '/attendance', label: 'Attendance', icon: '🕑' },
  { to: '/leave', label: 'Leave Approvals', icon: '✅' },
  { to: '/payroll', label: 'Payroll', icon: '💰' },
  { to: '/profile', label: 'My Profile', icon: '👤' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [theme, toggleTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const nav = user.role === 'admin' ? ADMIN_NAV : EMPLOYEE_NAV;

  // Poll unread notifications so the bell badge stays fresh.
  useEffect(() => {
    let alive = true;
    const load = () => api.get('/notifications').then((d) => alive && setUnread(d.unread)).catch(() => {});
    load();
    const t = setInterval(load, 15000);
    return () => { alive = false; clearInterval(t); };
  }, [location.pathname]);

  // Close the mobile drawer on navigation.
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="shell">
      <div className={`backdrop ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-symbol" role="img" aria-label="Genesis logo" />
          <div>
            <div className="brand-name">GENESIS</div>
            <div className="brand-tag">HR management, simplified</div>
          </div>
        </div>
        <nav className="nav">
          <div className="nav-section">{user.role === 'admin' ? 'Management' : 'Menu'}</div>
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-ico">{n.icon}</span>{n.label}
            </NavLink>
          ))}
          <div className="nav-section">Account</div>
          <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-ico">🔔</span>Notifications
            {unread > 0 && <span className="badge badge-red" style={{ marginLeft: 'auto' }}>{unread}</span>}
          </NavLink>
          <button className="nav-item" style={{ width: '100%', border: 'none', background: 'none' }}
            onClick={() => { logout(); navigate('/login'); }}>
            <span className="nav-ico">🚪</span>Logout
          </button>
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn mobile-toggle" onClick={() => setOpen((o) => !o)}>☰</button>
          <div className="searchbox">
            <input className="input" placeholder="Search…"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && user.role === 'admin')
                  navigate(`/employees?q=${encodeURIComponent(e.target.value)}`);
              }} />
          </div>
          <div style={{ flex: 1 }} />
          <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button className="icon-btn" onClick={() => navigate('/notifications')} title="Notifications">
            🔔{unread > 0 && <span className="dot" />}
          </button>
          <div className="row" style={{ gap: 8 }}>
            <div className="avatar">{user.name[0].toUpperCase()}</div>
            <div style={{ lineHeight: 1.2 }} className="user-meta">
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{user.name}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {user.role === 'admin' ? 'HR / Admin' : user.employee_code}
              </div>
            </div>
          </div>
        </header>

        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
