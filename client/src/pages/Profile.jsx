import { useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../App.jsx';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ full_name: user?.full_name || '', department: user?.department || '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const updated = await api.patch('/profiles/me', form);
      setUser(u => ({ ...u, ...updated }));
      setSuccess('Perfil actualizado correctamente');
    } catch(err) { setError(err.message); }
    setLoading(false);
  }

  return (
    <div style={{maxWidth:500}}>
      <div className="page-header">
        <h1 className="page-title">👤 Mi Perfil</h1>
      </div>
      <div className="card">
        <div style={{textAlign:'center', marginBottom:24}}>
          <div style={{width:64, height:64, borderRadius:'50%', background:'var(--primary)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, margin:'0 auto 12px'}}>
            {user?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{fontWeight:600}}>{user?.full_name}</div>
          <div style={{color:'var(--muted)', fontSize:13}}>{user?.email}</div>
          <div style={{marginTop:6}}>
            <span className="badge" style={{background: user?.role === 'admin' ? '#fee2e2' : user?.role === 'agent' ? '#dbeafe' : '#f1f5f9', color: user?.role === 'admin' ? '#991b1b' : user?.role === 'agent' ? '#1d4ed8' : 'var(--muted)'}}>
              {user?.role === 'admin' ? '🛡️ Admin' : user?.role === 'agent' ? '🎯 Agente' : '👤 Usuario'}
            </span>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre completo</label>
            <input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Área / Departamento</label>
            <input type="text" value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="Ej: Tecnología, RRHH, Ventas..." />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}
