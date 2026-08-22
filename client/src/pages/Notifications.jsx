import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useToast } from '../auth.jsx';
import { Spinner, EmptyState, Badge } from '../components/ui.jsx';

const ICON = { success: '✅', warning: '⚠️', info: 'ℹ️' };

export default function Notifications() {
  const toast = useToast();
  const [items, setItems] = useState(null);

  const load = () => api.get('/notifications').then((d) => setItems(d.notifications)).catch(() => {});
  useEffect(() => { load(); }, []);

  const markAll = async () => {
    try { await api.put('/notifications/read-all'); toast.success('Marked all as read'); load(); }
    catch (e) { toast.error(e.message); }
  };
  const markOne = async (id) => { await api.put(`/notifications/${id}/read`).catch(() => {}); load(); };

  if (!items) return <Spinner />;
  const unread = items.filter((n) => !n.is_read).length;

  return (
    <>
      <div className="page-head row between">
        <div><h1>Notifications</h1><p>{unread > 0 ? `${unread} unread` : 'You’re all caught up.'}</p></div>
        {unread > 0 && <button className="btn btn-ghost" onClick={markAll}>Mark all read</button>}
      </div>

      <div className="card">
        {items.length === 0 ? (
          <EmptyState icon="🔔" title="No notifications yet" subtitle="Updates about leave, payslips and more will show up here." />
        ) : (
          <div>
            {items.map((n) => (
              <div key={n.id} onClick={() => !n.is_read && markOne(n.id)}
                className="row" style={{
                  gap: 12, padding: '15px 20px', borderBottom: '1px solid var(--border)',
                  alignItems: 'flex-start', cursor: n.is_read ? 'default' : 'pointer',
                  background: n.is_read ? 'transparent' : 'var(--surface-2)',
                }}>
                <span style={{ fontSize: 18 }}>{ICON[n.type] || 'ℹ️'}</span>
                <div style={{ flex: 1 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <strong>{n.title}</strong>
                    {!n.is_read && <Badge tone="brand">new</Badge>}
                  </div>
                  <div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>{n.message}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>{new Date(n.created_at).toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
