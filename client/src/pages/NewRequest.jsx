import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

const AREAS = [
  { id: 'rem', name: 'Remuneraciones', icon: '💰', color: '#10b981' },
  { id: 'ing', name: 'Ingreso de Antecedentes', icon: '📥', color: '#f59e0b' },
  { id: 'sis', name: 'Sistema de Antecedentes', icon: '💻', color: '#3b82f6' },
  { id: 'ctrl', name: 'Control y Seguimiento', icon: '📊', color: '#8b5cf6' },
];

export default function NewRequest() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ area: '', category_id: '', type: 'question', priority: 'medium', title: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/categories').then(setCategories).catch(() => {});
  }, []);

  const filteredCats = categories.filter(c => c.area === form.area && c.active !== false);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const req = await api.post('/requests', { title: form.title, description: form.description, category_id: form.category_id, type: form.type, priority: form.priority });
      navigate(`/requests/${req.id}`);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={s.title}>Nueva Solicitud</h1>
      <div style={s.steps}>
        {['Área', 'Tipo', 'Detalle', 'Revisión'].map((l, i) => (
          <div key={l} style={{ ...s.step, ...(step > i + 1 ? s.stepDone : step === i + 1 ? s.stepActive : {}) }}>
            <div style={s.stepNum}>{step > i + 1 ? '✓' : i + 1}</div>
            <span>{l}</span>
          </div>
        ))}
      </div>

      <div style={s.card}>
        {step === 1 && (
          <div>
            <h2 style={s.stepTitle}>¿A qué área va dirigida?</h2>
            <div style={s.areaGrid}>
              {AREAS.map(a => (
                <button key={a.id} onClick={() => { setForm(f => ({ ...f, area: a.id, category_id: '' })); setStep(2); }}
                  style={{ ...s.areaCard, border: `2px solid ${form.area === a.id ? a.color : '#e2e8f0'}`, background: form.area === a.id ? a.color + '11' : '#fff' }}>
                  <span style={{ fontSize: 36 }}>{a.icon}</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{a.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={s.stepTitle}>Tipo y prioridad</h2>
            <div style={s.field}><label style={s.label}>Categoría</label>
              <select style={s.input} value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                <option value="">Seleccionar categoría</option>
                {filteredCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={s.field}><label style={s.label}>Tipo</label>
              <select style={s.input} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="question">Consulta</option>
                <option value="request">Solicitud</option>
                <option value="incident">Incidente</option>
              </select>
            </div>
            <div style={s.field}><label style={s.label}>Prioridad</label>
              <select style={s.input} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <div style={s.actions}>
              <button style={s.btnSecondary} onClick={() => setStep(1)}>Atrás</button>
              <button style={s.btnPrimary} onClick={() => setStep(3)} disabled={!form.category_id}>Siguiente</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={s.stepTitle}>Detalle de la solicitud</h2>
            <div style={s.field}><label style={s.label}>Título</label>
              <input style={s.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Resumen breve del problema o consulta" />
            </div>
            <div style={s.field}><label style={s.label}>Descripción</label>
              <textarea style={{ ...s.input, minHeight: 120, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe en detalle tu solicitud..." />
            </div>
            <div style={s.actions}>
              <button style={s.btnSecondary} onClick={() => setStep(2)}>Atrás</button>
              <button style={s.btnPrimary} onClick={() => setStep(4)} disabled={!form.title}>Siguiente</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={s.stepTitle}>Revisa tu solicitud</h2>
            <div style={s.review}>
              <div style={s.reviewRow}><span style={s.reviewLabel}>Área</span><span>{AREAS.find(a => a.id === form.area)?.name}</span></div>
              <div style={s.reviewRow}><span style={s.reviewLabel}>Categoría</span><span>{filteredCats.find(c => c.id === form.category_id)?.name}</span></div>
              <div style={s.reviewRow}><span style={s.reviewLabel}>Tipo</span><span style={{ textTransform: 'capitalize' }}>{form.type}</span></div>
              <div style={s.reviewRow}><span style={s.reviewLabel}>Prioridad</span><span style={{ textTransform: 'capitalize' }}>{form.priority}</span></div>
              <div style={s.reviewRow}><span style={s.reviewLabel}>Título</span><span>{form.title}</span></div>
              <div style={s.reviewRow}><span style={s.reviewLabel}>Descripción</span><span style={{ whiteSpace: 'pre-wrap' }}>{form.description}</span></div>
            </div>
            {error && <div style={s.error}>{error}</div>}
            <div style={s.actions}>
              <button style={s.btnSecondary} onClick={() => setStep(3)}>Atrás</button>
              <button style={s.btnPrimary} onClick={handleSubmit} disabled={loading}>{loading ? 'Enviando...' : 'Enviar Solicitud'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  title: { fontSize: 28, fontWeight: 700, color: '#1e3a5f', marginBottom: 24 },
  steps: { display: 'flex', gap: 8, marginBottom: 32, alignItems: 'center' },
  step: { display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 14 },
  stepActive: { color: '#2563eb', fontWeight: 600 },
  stepDone: { color: '#10b981' },
  stepNum: { width: 28, height: 28, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 },
  card: { background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', maxWidth: 640 },
  stepTitle: { fontSize: 20, fontWeight: 600, color: '#1e3a5f', marginBottom: 24 },
  areaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  areaCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 24, borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#fff' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  btnPrimary: { padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14 },
  btnSecondary: { padding: '10px 24px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14 },
  review: { background: '#f8fafc', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 },
  reviewRow: { display: 'flex', gap: 16 },
  reviewLabel: { width: 100, fontWeight: 600, color: '#64748b', fontSize: 13, flexShrink: 0 },
  error: { background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 12 },
};
