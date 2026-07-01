import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../App.jsx';

const STATUS_LABELS = { open: 'Abierta', in_progress: 'En proceso', resolved: 'Resuelta', closed: 'Cerrada', rejected: 'Rechazada' };
const TYPE_LABELS = { request: 'Solicitud', question: 'Pregunta', complaint: 'Queja', suggestion: 'Sugerencia' };
const PRIORITY_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente' };

export default function RequestsPage() {
  const { user } = useAuth();
  const isStaff = ['admin', 'agent'].includes(user?.role);
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ status: '', category_id: '', type: '', priority: '', search: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/categories').then(setCategories).catch(() => {});
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
      const data = await api.get(`/requests?${params}`);
      setRequests(data.data || []);
    } catch {}
    setLoading(false);
  }

  function handleFilter(key, val) {
    const newF = { ...filters, [key]: val };
    setFilters(newF);
  }

  useEffect(() => { loadRequests(); }, [filters]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isStaff ? 'Todas las Solicitudes' : 'Mis Solicitudes'}</h1>
          <p className="page-subtitle">{requests.length} solicitudes</p>
        </div>
        <Link to="/requests/new" className="btn btn-primary">➕ Nueva</Link>
      </div>

      <div className="filters">
        <input placeholder="Buscar..." value={filters.search}
          onChange={e => handleFilter('search', e.target.value)} style={{minWidth:200}} />
        <select value={filters.status} onChange={e => handleFilter('status', e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filters.type} onChange={e => handleFilter('type', e.target.value)}>
          <option value="">Todos los tipos</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filters.priority} onChange={e => handleFilter('priority', e.target.value)}>
          <option value="">Todas las prioridades</option>
          {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {categories.length > 0 && (
          <select value={filters.category_id} onChange={e => handleFilter('category_id', e.target.value)}>
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        )}
      </div>

      <div className="card" style={{padding: 0, overflow: 'hidden'}}>
        {loading ? (
          <div style={{textAlign:'center', padding:40}}>Cargando...</div>
        ) : requests.length === 0 ? (
          <div className="empty-state"><div className="icon">🔍</div><p>No se encontraron solicitudes</p></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Título</th>
                {isStaff && <th>Solicitante</th>}
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/requests/${r.id}`}>{r.title}</Link>
                    {r.comment_count > 0 && <span style={{marginLeft:6, fontSize:11, color:'var(--muted)'}}>💬 {r.comment_count}</span>}
                  </td>
                  {isStaff && <td style={{fontSize:13, color:'var(--muted)'}}>{r.user_name || r.user_email}</td>}
                  <td style={{fontSize:13}}>{TYPE_LABELS[r.type]}</td>
                  <td style={{fontSize:13}}>{r.category_icon} {r.category_name || '—'}</td>
                  <td><span className={`badge badge-${r.priority}`}>{PRIORITY_LABELS[r.priority]}</span></td>
                  <td><span className={`badge badge-${r.status}`}>{STATUS_LABELS[r.status]}</span></td>
                  <td style={{fontSize:13, color:'var(--muted)'}}>{new Date(r.created_at).toLocaleDateString('es')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
