import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function NewRequestPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', type: 'request', priority: 'medium', category_id: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/categories').then(setCategories).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return setError('Completa todos los campos obligatorios');
    setError(''); setLoading(true);
    try {
      const data = await api.post('/requests', { ...form, category_id: form.category_id || null });
      navigate(`/requests/${data.id}`);
    } catch(err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{maxWidth: 600}}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Nueva Solicitud</h1>
          <p className="page-subtitle">Describe tu solicitud o pregunta con detalle</p>
        </div>
      </div>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título *</label>
            <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              placeholder="Resume tu solicitud en una línea" required />
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            <div className="form-group">
              <label>Tipo</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="request">📋 Solicitud</option>
                <option value="question">❓ Pregunta</option>
                <option value="complaint">⚠️ Queja</option>
                <option value="suggestion">💡 Sugerencia</option>
              </select>
            </div>
            <div className="form-group">
              <label>Prioridad</label>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                <option value="low">🟢 Baja</option>
                <option value="medium">🟡 Media</option>
                <option value="high">🟠 Alta</option>
                <option value="urgent">🔴 Urgente</option>
              </select>
            </div>
          </div>
          {categories.length > 0 && (
            <div className="form-group">
              <label>Categoría</label>
              <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
                <option value="">Sin categoría</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label>Descripción *</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Describe con detalle tu solicitud, el problema o la pregunta..." required rows={6} />
          </div>
          <div style={{display:'flex', gap:10}}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Enviando...' : '✉️ Enviar Solicitud'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
