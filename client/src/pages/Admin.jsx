import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

export default function AdminPage() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [newCat, setNewCat] = useState({ name: '', description: '', color: '#6366f1', icon: '📋' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/admin/users'),
      api.get('/admin/categories'),
      api.get('/stats'),
    ]).then(([u, c, s]) => { setUsers(u); setCategories(c); setStats(s); }).catch(() => {});
  }, []);

  async function changeRole(userId, role) {
    try {
      const updated = await api.patch(`/admin/users/${userId}/role`, { role });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: updated.role } : u));
      setSuccess('Rol actualizado');
      setTimeout(() => setSuccess(''), 3000);
    } catch(err) { setError(err.message); }
  }

  async function createCategory(e) {
    e.preventDefault();
    try {
      const cat = await api.post('/admin/categories', newCat);
      setCategories(prev => [...prev, cat]);
      setNewCat({ name: '', description: '', color: '#6366f1', icon: '📋' });
      setSuccess('Categoría creada');
      setTimeout(() => setSuccess(''), 3000);
    } catch(err) { setError(err.message); }
  }

  async function deleteCategory(id) {
    if (!confirm('¿Eliminar esta categoría?')) return;
    await api.delete(`/admin/categories/${id}`);
    setCategories(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">⚙️ Panel de Administración</h1></div>
      </div>

      {stats && (
        <div className="stats-grid" style={{marginBottom:24}}>
          <div className="stat-card"><div className="stat-number">{stats.total}</div><div className="stat-label">Total solicitudes</div></div>
          <div className="stat-card"><div className="stat-number" style={{color:'#1d4ed8'}}>{stats.open}</div><div className="stat-label">Abiertas</div></div>
          <div className="stat-card"><div className="stat-number" style={{color:'#92400e'}}>{stats.in_progress}</div><div className="stat-label">En proceso</div></div>
          <div className="stat-card"><div className="stat-number" style={{color:'#065f46'}}>{stats.resolved}</div><div className="stat-label">Resueltas</div></div>
          <div className="stat-card"><div className="stat-number">{users.length}</div><div className="stat-label">Usuarios</div></div>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div style={{display:'flex', gap:4, marginBottom:20}}>
        {['users', 'categories'].map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(t)}>
            {t === 'users' ? '👥 Usuarios' : '🏷️ Categorías'}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <table className="table">
            <thead><tr><th>Nombre</th><th>Email</th><th>Área</th><th>Rol</th><th>Registrado</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{fontWeight:500}}>{u.full_name}</td>
                  <td style={{color:'var(--muted)', fontSize:13}}>{u.email}</td>
                  <td style={{fontSize:13}}>{u.department || '—'}</td>
                  <td>
                    <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                      style={{padding:'4px 8px', border:'1px solid var(--border)', borderRadius:'var(--radius)', fontSize:13}}>
                      <option value="user">Usuario</option>
                      <option value="agent">Agente</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{fontSize:13, color:'var(--muted)'}}>{new Date(u.created_at).toLocaleDateString('es')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'categories' && (
        <div>
          <div className="card" style={{marginBottom:20}}>
            <h3 style={{fontWeight:600, marginBottom:16}}>Nueva Categoría</h3>
            <form onSubmit={createCategory} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
              <div className="form-group" style={{marginBottom:0}}>
                <label>Nombre *</label>
                <input type="text" value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})} required placeholder="Ej: Legal" />
              </div>
              <div className="form-group" style={{marginBottom:0}}>
                <label>Icono</label>
                <input type="text" value={newCat.icon} onChange={e => setNewCat({...newCat, icon: e.target.value})} placeholder="📋" />
              </div>
              <div className="form-group" style={{marginBottom:0}}>
                <label>Descripción</label>
                <input type="text" value={newCat.description} onChange={e => setNewCat({...newCat, description: e.target.value})} />
              </div>
              <div className="form-group" style={{marginBottom:0}}>
                <label>Color</label>
                <input type="color" value={newCat.color} onChange={e => setNewCat({...newCat, color: e.target.value})} style={{height:38}} />
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <button type="submit" className="btn btn-primary">Crear categoría</button>
              </div>
            </form>
          </div>

          <div className="card" style={{padding:0, overflow:'hidden'}}>
            <table className="table">
              <thead><tr><th>Categoría</th><th>Descripción</th><th>Acciones</th></tr></thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id}>
                    <td>
                      <span style={{display:'inline-flex', alignItems:'center', gap:8}}>
                        <span style={{width:12, height:12, borderRadius:'50%', background:c.color, display:'inline-block'}}></span>
                        {c.icon} {c.name}
                      </span>
                    </td>
                    <td style={{color:'var(--muted)', fontSize:13}}>{c.description || '—'}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteCategory(c.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
