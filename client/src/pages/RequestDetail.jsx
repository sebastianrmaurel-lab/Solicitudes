import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../App.jsx';

const STATUS_LABELS = { open: 'Abierta', in_progress: 'En proceso', resolved: 'Resuelta', closed: 'Cerrada', rejected: 'Rechazada' };
const TYPE_LABELS = { request: 'Solicitud', question: 'Pregunta', complaint: 'Queja', suggestion: 'Sugerencia' };
const PRIORITY_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente' };

export default function RequestDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [comments, setComments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isStaff = ['admin', 'agent'].includes(user?.role);

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    try {
      const [req, comms] = await Promise.all([
        api.get(`/requests/${id}`),
        api.get(`/comments?request_id=${id}`),
      ]);
      setRequest(req);
      setComments(comms);
      if (isStaff) {
        const users = await api.get('/admin/users');
        setAgents(users.filter(u => ['admin', 'agent'].includes(u.role)));
      }
    } catch { navigate('/requests'); }
  }

  async function updateField(field, value) {
    try {
      const updated = await api.patch(`/requests/${id}`, { [field]: value });
      setRequest(r => ({ ...r, ...updated }));
    } catch(err) { setError(err.message); }
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const comment = await api.post('/comments', { request_id: id, content: newComment, is_internal: isInternal });
      setComments(c => [...c, comment]);
      setNewComment('');
    } catch(err) { setError(err.message); }
    setSubmitting(false);
  }

  if (!request) return <div style={{textAlign:'center', padding:60}}>Cargando...</div>;

  return (
    <div style={{maxWidth: 800}}>
      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:20, fontSize:14, color:'var(--muted)'}}>
        <Link to="/requests" style={{color:'var(--muted)'}}>← Volver</Link>
      </div>

      <div className="card" style={{marginBottom:20}}>
        <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16}}>
          <div style={{flex:1}}>
            <h1 style={{fontSize:20, fontWeight:700, marginBottom:8}}>{request.title}</h1>
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              <span className={`badge badge-${request.status}`}>{STATUS_LABELS[request.status]}</span>
              <span className={`badge badge-${request.priority}`}>{PRIORITY_LABELS[request.priority]}</span>
              <span className="badge" style={{background:'#f1f5f9', color:'var(--muted)'}}>{TYPE_LABELS[request.type]}</span>
              {request.category_name && <span className="badge" style={{background:'#f1f5f9', color:'var(--text)'}}>{request.category_icon} {request.category_name}</span>}
            </div>
          </div>
        </div>

        <div className="detail-meta">
          <div className="meta-item"><label>Solicitante</label><span>{request.user_name || request.user_email}</span></div>
          {request.department && <div className="meta-item"><label>Área</label><span>{request.department}</span></div>}
          <div className="meta-item"><label>Creada</label><span>{new Date(request.created_at).toLocaleString('es')}</span></div>
          {request.resolved_at && <div className="meta-item"><label>Resuelta</label><span>{new Date(request.resolved_at).toLocaleString('es')}</span></div>}
          {request.assigned_name && <div className="meta-item"><label>Asignada a</label><span>{request.assigned_name}</span></div>}
        </div>

        <div style={{background:'var(--bg)', borderRadius:'var(--radius)', padding:16, whiteSpace:'pre-wrap', fontSize:14}}>
          {request.description}
        </div>

        {isStaff && (
          <div style={{marginTop:16, paddingTop:16, borderTop:'1px solid var(--border)'}}>
            <h3 style={{fontWeight:600, marginBottom:12, fontSize:14}}>⚙️ Gestión (staff)</h3>
            <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
              <div style={{display:'flex', flexDirection:'column', gap:4}}>
                <label style={{fontSize:12, fontWeight:600, color:'var(--muted)'}}>ESTADO</label>
                <select value={request.status} onChange={e => updateField('status', e.target.value)}
                  style={{padding:'6px 10px', border:'1px solid var(--border)', borderRadius:'var(--radius)', fontSize:13}}>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:4}}>
                <label style={{fontSize:12, fontWeight:600, color:'var(--muted)'}}>PRIORIDAD</label>
                <select value={request.priority} onChange={e => updateField('priority', e.target.value)}
                  style={{padding:'6px 10px', border:'1px solid var(--border)', borderRadius:'var(--radius)', fontSize:13}}>
                  {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              {agents.length > 0 && (
                <div style={{display:'flex', flexDirection:'column', gap:4}}>
                  <label style={{fontSize:12, fontWeight:600, color:'var(--muted)'}}>ASIGNAR A</label>
                  <select value={request.assigned_to || ''} onChange={e => updateField('assigned_to', e.target.value || null)}
                    style={{padding:'6px 10px', border:'1px solid var(--border)', borderRadius:'var(--radius)', fontSize:13}}>
                    <option value="">Sin asignar</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Historial de estados */}
      {request.status_history?.length > 0 && (
        <div className="card" style={{marginBottom:20, padding:16}}>
          <h3 style={{fontWeight:600, marginBottom:12}}>📋 Historial de estados</h3>
          {request.status_history.map(h => (
            <div key={h.id} style={{display:'flex', gap:8, alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:13}}>
              <span className={`badge badge-${h.old_status}`} style={{minWidth:80, justifyContent:'center'}}>{STATUS_LABELS[h.old_status] || '—'}</span>
              <span>→</span>
              <span className={`badge badge-${h.new_status}`} style={{minWidth:80, justifyContent:'center'}}>{STATUS_LABELS[h.new_status]}</span>
              <span style={{color:'var(--muted)', marginLeft:'auto'}}>{new Date(h.created_at).toLocaleString('es')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Comentarios */}
      <div className="card">
        <h3 style={{fontWeight:600, marginBottom:16}}>💬 Comentarios ({comments.length})</h3>
        {comments.length === 0 && <div style={{color:'var(--muted)', fontSize:14, marginBottom:16}}>Sin comentarios aún.</div>}
        {comments.map(c => (
          <div key={c.id} className={`comment ${c.user?.role !== 'user' ? 'comment-staff' : 'comment-user'} ${c.is_internal ? 'comment-internal' : ''}`}>
            <div className="comment-header">
              <span className="comment-author">{c.user?.full_name || c.user?.email} {c.is_internal && '🔒'}</span>
              <span className="comment-time">{new Date(c.created_at).toLocaleString('es')}</span>
            </div>
            <div className="comment-body">{c.content}</div>
          </div>
        ))}

        <form onSubmit={submitComment} style={{marginTop:16}}>
          <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
            placeholder="Escribe un comentario o respuesta..." rows={3}
            style={{width:'100%', padding:'9px 12px', border:'1px solid var(--border)', borderRadius:'var(--radius)', fontSize:14, marginBottom:8, resize:'vertical'}} />
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <button className="btn btn-primary btn-sm" type="submit" disabled={submitting || !newComment.trim()}>
              {submitting ? 'Enviando...' : '💬 Comentar'}
            </button>
            {isStaff && (
              <label style={{display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--muted)', cursor:'pointer'}}>
                <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                Nota interna (solo staff)
              </label>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
