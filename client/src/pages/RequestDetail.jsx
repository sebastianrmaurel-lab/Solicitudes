import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../App.jsx';

const STATUS_COLORS = { open: '#3b82f6', in_progress: '#f59e0b', resolved: '#10b981', closed: '#6b7280' };
const STATUS_LABELS = { open: 'Abierta', in_progress: 'En progreso', resolved: 'Resuelta', closed: 'Cerrada' };

export default function RequestDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [req, setReq] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [r, c] = await Promise.all([
      api.get(`/requests/${id}`),
      api.get(`/comments?request_id=${id}`)
    ]);
    setReq(r); setComments(c);
  };

  useEffect(() => { fetchData().finally(() => setLoading(false)); }, [id]);

  const handleStatus = async (status) => {
    await api.patch(`/requests/${id}`, { status });
    fetchData();
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    await api.post('/comments', { request_id: id, content: comment, is_internal: isInternal });
    setComment('');
    fetchData();
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta solicitud?')) return;
    await api.delete(`/requests/${id}`);
    navigate('/requests');
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>Cargando...</div>;
  if (!req) return <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>No encontrado</div>;

  const isStaff = ['admin', 'agent'].includes(profile?.role);

  return (
    <div>
      <button onClick={() => navigate('/requests')} style={s.back}>← Volver</button>
      <div style={s.layout}>
        <div style={s.main}>
          <div style={s.card}>
            <div style={s.cardHeader}>
              <h1 style={s.title}>{req.title}</h1>
              <span style={{ ...s.badge, background: STATUS_COLORS[req.status] + '22', color: STATUS_COLORS[req.status] }}>{STATUS_LABELS[req.status]}</span>
            </div>
            <p style={s.desc}>{req.description}</p>
          </div>

          <div style={s.card}>
            <h2 style={s.sectionTitle}>Comentarios</h2>
            <div style={s.commentList}>
              {comments.length === 0 ? <div style={s.empty}>Sin comentarios</div> : comments.map(c => (
                <div key={c.id} style={{ ...s.comment, ...(c.is_internal ? s.commentInternal : {}) }}>
                  <div style={s.commentHeader}>
                    <strong style={{ color: '#1e293b', fontSize: 13 }}>{c.profiles?.full_name || 'Usuario'}</strong>
                    {c.is_internal && <span style={s.internalTag}>Interno</span>}
                    <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 'auto' }}>{new Date(c.created_at).toLocaleString('es-CL')}</span>
                  </div>
                  <p style={{ color: '#475569', fontSize: 14, marginTop: 4 }}>{c.content}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleComment} style={s.commentForm}>
              <textarea style={s.commentInput} value={comment} onChange={e => setComment(e.target.value)} placeholder="Escribe un comentario..." rows={3} />
              {isStaff && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
                  <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                  Nota interna
                </label>
              )}
              <button type="submit" style={s.btnPrimary} disabled={!comment.trim()}>Comentar</button>
            </form>
          </div>
        </div>

        <div style={s.sidebar}>
          <div style={s.card}>
            <h3 style={s.sectionTitle}>Detalles</h3>
            <div style={s.detail}><span style={s.detailLabel}>Área</span><span>{req.area}</span></div>
            <div style={s.detail}><span style={s.detailLabel}>Categoría</span><span>{req.category_name}</span></div>
            <div style={s.detail}><span style={s.detailLabel}>Tipo</span><span style={{ textTransform: 'capitalize' }}>{req.type}</span></div>
            <div style={s.detail}><span style={s.detailLabel}>Prioridad</span><span style={{ textTransform: 'capitalize' }}>{req.priority}</span></div>
            <div style={s.detail}><span style={s.detailLabel}>Creada</span><span>{new Date(req.created_at).toLocaleDateString('es-CL')}</span></div>
            {req.user_full_name && <div style={s.detail}><span style={s.detailLabel}>Por</span><span>{req.user_full_name}</span></div>}
          </div>

          {isStaff && (
            <div style={s.card}>
              <h3 style={s.sectionTitle}>Cambiar estado</h3>
              <div style={s.statusBtns}>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <button key={key} onClick={() => handleStatus(key)}
                    style={{ ...s.statusBtn, background: req.status === key ? STATUS_COLORS[key] : '#f1f5f9', color: req.status === key ? '#fff' : '#475569' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {profile?.role === 'admin' && (
            <button onClick={handleDelete} style={s.deleteBtn}>🗑 Eliminar solicitud</button>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  back: { background: 'none', border: 'none', color: '#2563eb', fontSize: 14, cursor: 'pointer', marginBottom: 20, padding: 0 },
  layout: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' },
  main: { display: 'flex', flexDirection: 'column', gap: 20 },
  sidebar: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 700, color: '#1e3a5f', flex: 1 },
  badge: { padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' },
  desc: { color: '#475569', lineHeight: 1.6 },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: '#1e3a5f', marginBottom: 16 },
  commentList: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 },
  empty: { color: '#94a3b8', fontSize: 14, textAlign: 'center', padding: 16 },
  comment: { padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' },
  commentInternal: { background: '#fffbeb', border: '1px solid #fde68a' },
  commentHeader: { display: 'flex', alignItems: 'center', gap: 8 },
  internalTag: { fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: 4, fontWeight: 600 },
  commentForm: { display: 'flex', flexDirection: 'column', gap: 10 },
  commentInput: { padding: 12, border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, resize: 'vertical' },
  btnPrimary: { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, alignSelf: 'flex-end' },
  detail: { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid #f1f5f9', color: '#1e293b' },
  detailLabel: { color: '#64748b', fontWeight: 500 },
  statusBtns: { display: 'flex', flexDirection: 'column', gap: 8 },
  statusBtn: { padding: '8px 12px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  deleteBtn: { width: '100%', padding: 10, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
};
