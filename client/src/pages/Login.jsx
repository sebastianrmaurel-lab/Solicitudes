import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp } from '../lib/supabase.js';
import { api } from '../lib/api.js';
import { useAuth } from '../App.jsx';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setMsg('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        const profile = await api.get('/profiles/me');
        setUser(profile);
        navigate('/dashboard');
      } else {
        await signUp(email, password, fullName);
        setMsg('¡Cuenta creada! Revisa tu email para confirmar y luego inicia sesión.');
        setMode('login');
      }
    } catch(err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)'}}>
      <div style={{width: '100%', maxWidth: 400, padding: 16}}>
        <div className="card">
          <div style={{textAlign: 'center', marginBottom: 24}}>
            <div style={{fontSize: 40, marginBottom: 8}}>📋</div>
            <h1 style={{fontSize: 22, fontWeight: 700}}>Portal de Solicitudes</h1>
            <p style={{color: 'var(--muted)', fontSize: 14, marginTop: 4}}>
              {mode === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta'}
            </p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {msg && <div className="alert alert-success">{msg}</div>}

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label>Nombre completo</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Tu nombre" />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@empresa.com" />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{width: '100%', justifyContent: 'center', padding: '10px'}}>
              {loading ? 'Cargando...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>

          <p style={{textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--muted)'}}>
            {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              style={{background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600}}>
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
