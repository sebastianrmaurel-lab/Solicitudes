import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../App.jsx';

const STATUS_COLORS = { open: '#3b82f6', in_progress: '#f59e0b', resolved: '#10b981', closed: '#6b7280' };
const STATUS_LABELS = { open: 'Abierta', in_progress: 'En progreso', resolved: 'Resuelta', closed: 'Cerrada' };

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api.get('/stats').then(setStats).catch(() => {});
    api.get('/requests?limit=5').then(r => setRecent(r.data || [])).catch(() => {});
  }, []);

  const cards = stats ? [
    { label: 'Total', value: stats.total, color: '#1e3a5f', icon: '📄' },
    { label: 'Abiertas', value: stats.open, color: '#3b82f6', icon: '🔵' },
    { label: 'En Progreso', value: stats.in_progress, color: '#f59e0b', icon: '🟡' },
    { label: 'Resueltas', value: stats.resolved, color: '#10b981', icon: '✅' },
  ] : [];

  return (
    <div>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Dashboard</h1>
          <p style={s.sub}>Bienvenido, {profile?.full_name || 'Usuario'}</p>
        </div>
        <Link to="/requests/new" style={s.newBtn}>+ Nueva Solicitud</Link>
      </div>

      <div style={s.cards}>
        {cards.map(c => (
          <div key={c.label} style={{ ...s.card, borderTop: `4px solid ${c.color}` }}>
            <div style={s.cardIcon}>{c.icon}</div>
            <div style={{ ...s.cardValue, color: c.color }}>{c.value}</div>
            <div style={s.cardLabel}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={s.section}>
        <h2 style={s.sectionTitle}>Solicitudes recientes</h2>
        {recent.length === 0 ? (
          <div style={s.empty}>No hay solicitudes aún. <Link to="/requests/new" style={{ color: '#2563eb' }}>Crear una</Link></div>
        ) : (
          <div style={s.list}>
            {recent.map(r => (
              <Link key={r.id} to={`/requests/${r.id}`} style={s.item}>
                <div style={s.itemTitle}>{r.title}</div>
                <div style={s.itemMeta}>
                  <span style={{ ...s.badge, background: STATUS_COLORS[r.status] + '22', color: STATUS_COLORS[r.status] }}>{STATUS_LABELS[r.status]}</span>
                  <span style={s.date}>{new Date(r.created_at).toLocaleDateString('es-CL')}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 700, color: '#1e3a5f' },
  sub: { color: '#64748b', marginTop: 4 },
  newBtn: { background: '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14 },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginBottom: 32 },
  card: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', textAlign: 'center' },
  cardIcon: { fontSize: 28, marginBottom: 8 },
  cardValue: { fontSize: 36, fontWeight: 700 },
  cardLabel: { color: '#64748b', fontSize: 13, marginTop: 4 },
  section: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  sectionTitle: { fontSize: 18, fontWeight: 600, color: '#1e3a5f', marginBottom: 16 },
  empty: { color: '#64748b', textAlign: 'center', padding: 32 },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 8, border: '1px solid #e2e8f0', transition: 'background 0.2s' },
  itemTitle: { fontWeight: 500, color: '#1e293b' },
  itemMeta: { display: 'flex', alignItems: 'center', gap: 12 },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 },
  date: { color: '#94a3b8', fontSize: 12 },
};
