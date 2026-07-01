import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../App.jsx';
import { useNavigate } from 'react-router-dom';

const AREAS = [
  { id: 'rem', name: 'Remuneraciones' },
  { id: 'ing', name: 'Ingreso de Antecedentes' },
  { id: 'sis', name: 'Sistema de Antecedentes' },
  { id: 'ctrl', name: 'Control y Seguimiento' },
];

export default function Admin() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'user', area: '' });
  const [catForm, setCatForm] = useState({ name: '', area: 'rem', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile?.role !== 'admin') { navigate('/dashboard'); return; }
    api.get('/admin/users').then(setUsers).catch(() => {});
    api.get('/admin/categories').then(setCategories).catch(() => {});
  }, []);

  const saveUser = async () => {
    setError('');
    try {
      if (editUser) {
        const updates = { full_name: form.full_name, role: form.role, area: form.role === 'agent' ? form.area : null };
        await api.patch(`/admin/users/${editUser.id}`, updates);
      } else {
        await api.post('/admin/users', form);
      }
      setShowModal(false);
      api.get('/admin/users').then(setUsers);
    } catch (e) { setError(e.message); }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ email: u.email, password: '', full_name: u.full_name || '', role: u.role, area: u.area || '' });
    setShowModal(true);
  };

  const toggleActive = async (u) => {
    await api.patch(`/admin/users/${u.id}`, { active: !u.active });
    api.get('/admin/users').then(setUsers);
  };

  const saveCategory = async () => {
    await api.post('/admin/categories', catForm);
    setCatForm({ name: '', area: 'rem', description: '' });
    api.get('/admin/categories').then(setCategories);
  };

  const deleteCategory = async (id) => {
    if (!confirm('¿Eliminar categoría?')) return;
    await api.delete(`/admin/categories/${id}`);
    api.get('/admin/categories').then(setCategories);
  };

  return (
    <div>
      <h1 style={s.title}>Administración</h1>
      <div style={s.tabs}>
        <button style={{ ...s.tab, ...(tab === 'users' ? s.tabActive : {}) }} onClick={() => setTab('users')}>👥 Usuarios</button>
        <button style={{ ...s.tab, ...(tab === 'categories' ? s.tabActive : {}) }} onClick={() => setTab('categories')}>🏷️ Categorías</button>
      </div>

      {tab === 'users' && (
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h2 style={s.sectionTitle}>Usuarios</h2>
            <button style={s.btnPrimary} onClick={() => { setEditUser(null); setForm({ email: '', password: '', full_name: '', role: 'user', area: '' }); setShowModal(true); }}>+ Nuevo usuario</button>
          </div>
          <table style={s.table}>
            <thead><tr style={s.thead}>
              <th style={s.th}>Nombre</th><th style={s.th}>Email</th><th style={s.th}>Rol</th><th style={s.th}>Área</th><th style={s.th}>Estado</th><th style={s.th}>Acciones</th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={s.tr}>
                  <td style={s.td}>{u.full_name || '—'}</td>
                  <td style={s.td}>{u.email}</td>
                  <td style={s.td}><span style={s.roleBadge}>{u.role}</span></td>
                  <td style={s.td}>{AREAS.find(a => a.id === u.area)?.name || '—'}</td>
                  <td style={s.td}><span style={{ ...s.statusDot, background: u.active !== false ? '#10b981' : '#ef4444' }}>{u.active !== false ? 'Activo' : 'Inactivo'}</span></td>
                  <td style={s.td}>
                    <button style={s.actionBtn} onClick={() => openEdit(u)}>Editar</button>
                    <button style={{ ...s.actionBtn, color: u.active !== false ? '#ef4444' : '#10b981' }} onClick={() => toggleActive(u)}>{u.active !== false ? 'Desactivar' : 'Activar'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'categories' && (
        <div>
          <div style={s.card}>
            <h2 style={s.sectionTitle}>Nueva categoría</h2>
            <div style={s.formRow}>
              <input style={s.input} placeholder="Nombre" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} />
              <select style={s.input} value={catForm.area} onChange={e => setCatForm(f => ({ ...f, area: e.target.value }))}>
                {AREAS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <button style={s.btnPrimary} onClick={saveCategory} disabled={!catForm.name}>Agregar</button>
            </div>
          </div>
          {AREAS.map(area => {
            const cats = categories.filter(c => c.area === area.id);
            return (
              <div key={area.id} style={s.card}>
                <h3 style={s.sectionTitle}>{area.name}</h3>
                {cats.length === 0 ? <p style={{ color: '#94a3b8', fontSize: 13 }}>Sin categorías</p> : (
                  <div style={s.catList}>
                    {cats.map(c => (
                      <div key={c.id} style={s.catItem}>
                        <span style={{ fontSize: 14 }}>{c.name}</span>
                        <button style={{ ...s.actionBtn, color: '#ef4444' }} onClick={() => deleteCategory(c.id)}>Eliminar</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>{editUser ? 'Editar usuario' : 'Nuevo usuario'}</h2>
            {error && <div style={s.error}>{error}</div>}
            <div style={s.field}><label style={s.label}>Nombre completo</label>
              <input style={s.input} value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
            {!editUser && <>
              <div style={s.field}><label style={s.label}>Email</label>
                <input style={s.input} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div style={s.field}><label style={s.label}>Contraseña</label>
                <input style={s.input} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
            </>}
            <div style={s.field}><label style={s.label}>Rol</label>
              <select style={s.input} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value, area: '' }))}>
                <option value="user">Usuario</option>
                <option value="agent">Agente</option>
                <option value="admin">Admin</option>
              </select></div>
            {form.role === 'agent' && (
              <div style={s.field}><label style={s.label}>Área</label>
                <select style={s.input} value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))}>
                  <option value="">Seleccionar área</option>
                  {AREAS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select></div>
            )}
            <div style={s.modalActions}>
              <button style={s.btnSecondary} onClick={() => setShowModal(false)}>Cancelar</button>
              <button style={s.btnPrimary} onClick={saveUser}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  title: { fontSize: 28, fontWeight: 700, color: '#1e3a5f', marginBottom: 24 },
  tabs: { display: 'flex', gap: 8, marginBottom: 24 },
  tab: { padding: '10px 20px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', color: '#64748b' },
  tabActive: { background: '#2563eb', color: '#fff', border: '1.5px solid #2563eb' },
  card: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 16 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#1e3a5f', marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8fafc' },
  th: { padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px', fontSize: 14, color: '#1e293b' },
  roleBadge: { background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 },
  statusDot: { padding: '3px 10px', borderRadius: 20, fontSize: 12, color: '#fff', fontWeight: 500 },
  actionBtn: { background: 'none', border: 'none', color: '#2563eb', fontSize: 13, cursor: 'pointer', marginRight: 8 },
  formRow: { display: 'flex', gap: 12, alignItems: 'flex-end' },
  input: { flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#fff', width: '100%' },
  catList: { display: 'flex', flexDirection: 'column', gap: 8 },
  catItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: 8 },
  btnPrimary: { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' },
  btnSecondary: { padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalTitle: { fontSize: 20, fontWeight: 700, color: '#1e3a5f', marginBottom: 20 },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  error: { background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 12, border: '1px solid #fecaca' },
};
