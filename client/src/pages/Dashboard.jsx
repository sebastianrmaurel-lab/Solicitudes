import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../App.jsx';

const STATUS_LABELS = { open: 'Abierta', in_progress: 'En proceso', resolved: 'Resuelta', closed: 'Cerrada', rejected: 'Rechazada' };
const TYPE_LABELS = { request: 'Solicitud', question: 'Pregunta', complaint: 'Queja', suggestion: 'Sugerencia' };

export default function DashboardPage() {
  const { user } = useAuth();
  const [recent, setRecent] = useState([]);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const isStaff = ['admin', 'agent'].includes(user?.role);

  useEffect(() => {
    async function load() {
      const [reqData, notifData] = await Promise.all([
        api.get('/requests?limit=5'),
        api.get('/profiles/notifications'),
      ]);
      setRecent(reqData.data || []);
      setNotifications((notifData || []).filter(n => !n.is_read).slice(0, 5));
      if (isStaff) {
        const s = await api.get('/stats');
        setStats(s);
      }
      setLoading(false);
    }
    load().catch(() => setLoading(false));
  }, [isStaff]);

  if (loading) return <div style={{textAlign:'center',padding:60}}>Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bienvenido, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Aquí tienes un resumen de tu actividad</p>
        </div>
        <Link to="/requests/new" className="btn btn-primary">➕ Nueva Solicitud</Link>
      </div>

      {isStaff && stats && (
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-number">{stats.total}</div><div className="stat-label">Total</div></div>
          <div className="stat-card"><div className="stat-number" style={{color:'#1d4ed8'}}>{stats.open}</div><div className="stat-label">Abiertas</div></div>
          <div className="stat-card"><div className="stat-number" style={{color:'#92400e'}}>{stats.in_progress}</div><div className="stat-label">En proceso</div></div>
          <div className="stat-card"><div className="stat-number" style={{color:'#065f46'}}>{stats.resolved}</div><div className="stat-label">Resueltas</div></div>
        </div>
      )}

      <div style={{display:'grid', gridTemplateColumns: notifications.length ? '1fr 320px' : '1fr', gap: 20}}>
        <div className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
            <h2 style={{fontWeight:700}}>Solicitudes recientes</h2>
            <Link to="/requests" style={{fontSize:13, color:'var(--primary)'}}>Ver todas →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="empty-state"><div className="icon">📭</div><p>No hay solicitudes aún.<br/><Link to="/requests/new">Crea la primera</Link></p></div>
          ) : (
            <table className="table">
              <thead><tr><th>Título</th><th>Tipo</th><th>Estado</th><th>Fecha</th></tr></thead>
              <tbody>
                {recent.map(r => (
                  <tr key={r.id}>
                    <td><Link to={`/requests/${r.id}`}>{r.title}</Link></td>
                    <td style={{color:'var(--muted)', fontSize:13}}>{TYPE_LABELS[r.type]}</td>
                    <td><span className={`badge badge-${r.status}`}>{STATUS_LABELS[r.status]}</span></td>
                    <td style={{color:'var(--muted)', fontSize:13}}>{new Date(r.created_at).toLocaleDateString('es')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="card">
            <h2 style={{fontWeight:700, marginBottom:16}}>🔔 Notificaciones</h2>
            {notifications.map(n => (
              <div key={n.id} style={{padding:'10px 0', borderBottom:'1px solid var(--border)'}}>
                <div style={{fontWeight:600, fontSize:14}}>{n.title}</div>
                <div style={{fontSize:13, color:'var(--muted)'}}>{n.message}</div>
                {n.request_id && <Link to={`/requests/${n.request_id}`} style={{fontSize:12, color:'var(--primary)'}}>Ver solicitud →</Link>}
              </div>
            ))}
            <button className="btn btn-outline btn-sm" style={{marginTop:12}} onClick={() => api.patch('/profiles/notifications/read', {})}>
              Marcar todas como leídas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
