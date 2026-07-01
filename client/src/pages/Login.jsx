import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../lib/supabase.js';
import { api } from '../lib/api.js';
import { useAuth } from '../App.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser, setProfile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await signIn(email, password);
      setUser(data.user);
      const profile = await api.get('/profile');
      setProfile(profile);
      navigate('/dashboard');
    } catch (err) {
      setError('Credenciales incorrectas. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <span style={s.icon}>📋</span>
          <h1 style={s.title}>Portal de Solicitudes</h1>
          <p style={s.subtitle}>Ingresa con tus credenciales</p>
        </div>
        <form onSubmit={handleSubmit} style={s.form}>
          {error && <div style={s.error}>{error}</div>}
          <div style={s.field}>
            <label style={s.label}>Correo electrónico</label>
            <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@empresa.com" required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Contraseña</label>
            <div style={s.passWrap}>
              <input style={{ ...s.input, paddingRight: 44 }} type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              <button type="button" onClick={() => setShowPass(!showPass)} style={s.eyeBtn}>{showPass ? '🙈' : '👁️'}</button>
            </div>
          </div>
          <button type="submit" style={s.btn} disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</button>
        </form>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)' },
  card: { background: '#fff', borderRadius: 16, padding: 40, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  header: { textAlign: 'center', marginBottom: 32 },
  icon: { fontSize: 48 },
  title: { fontSize: 24, fontWeight: 700, color: '#1e3a5f', margin: '12px 0 4px' },
  subtitle: { color: '#64748b', fontSize: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  error: { background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 14, border: '1px solid #fecaca' },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', width: '100%' },
  passWrap: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer' },
  btn: { marginTop: 8, padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600 },
};
