import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../App.jsx';

const STATUS_COLORS = { open: '#3b82f6', in_progress: '#f59e0b', resolved: '#10b981', closed: '#6b7280' };
const STATUS_LABELS = { open: 'Abierta', in_progress: 'En progreso', resolved: 'Resuelta', closed: 'Cerrada' };
const PRIORITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', urgent: '#7c3aed' };

export default function Requests() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ status: '', search: '', page: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (filters.status) q.set('status', filters.status);
    if (filters.search) q.set('search', filters.search);
    q.set('page', filters.page);
    api.get(`/requests?${q}`).then(r => { setRequests(r.data || []); setTotal(r.count || 0); }).finally(() => setLoading(false));
  }, [filters]);

  return (
    <div>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Solicitudes</h1>
          <p style={s.sub}>{total} solicitud{total !== 1 ? 'es' : ''} encontrada{total !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/requests/new" style={s.newBtn}>+ Nueva Solicitud</Link>
      </div>

      <div style={s.filters}>
        <input style={s.search} placeholder="Buscar..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))} />
        <select style={s.select} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}>
          <option value="">Todos los estados</option>
          <option value="open">Abierta</option>
          <option value="in_progress">En progreso</option>
          <option value="resolved">Resuelta</option>
          <option value="closed">Cerrada</option>
        </select>
      </div>

      <div style={s.list}>
        {loading ? <div style={s.empty}>Cargando...</div> : requests.length === 0 ? (
          <div style={s.empty}>No hay solicitudes. <Link to="/requests/new" style={{ color: '#2563eb' }}>Crear una</Link></div>
        ) : requests.map(r => (
          <Link key={r.id} to={`/requests/${r.id}`} style={s.item}>
            <div style={s.itemLeft}>
              <div style={s.itemTitle}>{r.title}</div>
              <div style={s.itemMeta}>
                <span style={s.category}>{r.category_name || 'Sin categoría'}</span>
                <span style={{ ...s.badge, background: PRIORITY_COLORS[r.priority] + '22', color: PRIORITY_COLORS[r.priority] }}>{r.priority}</span>
              </div>
            </div>
            <div style={s.itemRight}>
              <span style={{ ...s.badge, background: STATUS_COLORS[r.status] + '22', color: STATUS_COLORS[r.status] }}>{STATUS_LABELS[r.status]}</span>
              <span style={s.date}>{new Date(r.created_at).toLocaleDateString('es-CL')}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 700, color: '#1e3a5f' },
  sub: { color: '#64748b', marginTop: 4, fontSize: 14 },
  newBtn: { background: '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14 },
  filters: { display: 'flex', gap: 12, marginBottom: 20 },
  search: { flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14 },
  select: { padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#fff' },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  empty: { textAlign: 'center', padding: 48, color: '#64748b', background: '#fff', borderRadius: 12 },
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' },
  itemLeft: { display: 'flex', flexDirection: 'column', gap: 6 },
  itemTitle: { fontWeight: 600, color: '#1e293b', fontSize: 15 },
  itemMeta: { display: 'flex', gap: 8 },
  itemRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 },
  category: { fontSize: 12, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 },
  date: { color: '#94a3b8', fontSize: 12 },
};
