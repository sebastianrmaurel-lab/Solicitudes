import { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { getSession, signOut } from './lib/supabase.js';
import { api } from './lib/api.js';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Requests from './pages/Requests.jsx';
import NewRequest from './pages/NewRequest.jsx';
import RequestDetail from './pages/RequestDetail.jsx';
import Admin from './pages/Admin.jsx';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const AREAS = {
  rem:  { name: 'Remuneraciones', color: '#10b981' },
  ing:  { name: 'Ingreso de Antecedentes', color: '#f59e0b' },
  sis:  { name: 'Sistema de Antecedentes', color: '#3b82f6' },
  ctrl: { name: 'Control y Seguimiento', color: '#8b5cf6' },
};

function Sidebar({ user, profile }) {
  const location = useLocation();
  const active = (p) => location.pathname.startsWith(p) ? 'active' : '';

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <span style={styles.logoIcon}>📋</span>
        <span style={styles.logoText}>Portal</span>
      </div>
      {profile?.area && (
        <div style={{ ...styles.areaBadge, background: AREAS[profile.area]?.color + '22', color: AREAS[profile.area]?.color, border: `1px solid ${AREAS[profile.area]?.color}44` }}>
          {AREAS[profile.area]?.name}
        </div>
      )}
      <nav style={styles.nav}>
        <Link to="/dashboard" style={{ ...styles.navLink, ...(active('/dashboard') ? styles.navActive : {}) }}>🏠 Dashboard</Link>
        <Link to="/requests" style={{ ...styles.navLink, ...(active('/requests') ? styles.navActive : {}) }}>📄 Solicitudes</Link>
        {profile?.role === 'admin' && (
          <Link to="/admin" style={{ ...styles.navLink, ...(active('/admin') ? styles.navActive : {}) }}>⚙️ Administración</Link>
        )}
      </nav>
      <div style={styles.sidebarFooter}>
        <div style={styles.userInfo}>
          <div style={styles.userAvatar}>{profile?.full_name?.[0] || user?.email?.[0]}</div>
          <div>
            <div style={styles.userName}>{profile?.full_name || 'Usuario'}</div>
            <div style={styles.userRole}>{profile?.role}</div>
          </div>
        </div>
        <button onClick={handleSignOut} style={styles.signOutBtn}>Cerrar sesión</button>
      </div>
    </aside>
  );
}

function Layout({ children }) {
  const { user, profile } = useAuth();
  return (
    <div style={styles.layout}>
      <Sidebar user={user} profile={profile} />
      <main style={styles.main}>{children}</main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={styles.loading}>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
}

const styles = {
  layout: { display: 'flex', minHeight: '100vh' },
  sidebar: { width: 240, background: '#1e3a5f', color: '#fff', display: 'flex', flexDirection: 'column', padding: '24px 0', position: 'fixed', top: 0, left: 0, height: '100vh' },
  logo: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  logoIcon: { fontSize: 24 },
  logoText: { fontSize: 18, fontWeight: 700, color: '#fff' },
  areaBadge: { margin: '16px', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, textAlign: 'center' },
  nav: { flex: 1, padding: '16px 0' },
  navLink: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', color: 'rgba(255,255,255,0.7)', fontSize: 14, transition: 'all 0.2s' },
  navActive: { color: '#fff', background: 'rgba(255,255,255,0.1)', borderRight: '3px solid #60a5fa' },
  sidebarFooter: { padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  userAvatar: { width: 36, height: 36, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, textTransform: 'uppercase' },
  userName: { fontSize: 13, fontWeight: 600, color: '#fff' },
  userRole: { fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' },
  signOutBtn: { width: '100%', padding: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  main: { flex: 1, marginLeft: 240, padding: 32, minHeight: '100vh' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 18, color: '#64748b' },
};

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const session = await getSession();
        if (session) {
          setUser(session.user);
          const p = await api.get('/profile');
          setProfile(p);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, profile, setProfile, loading }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
          <Route path="/requests/new" element={<ProtectedRoute><NewRequest /></ProtectedRoute>} />
          <Route path="/requests/:id" element={<ProtectedRoute><RequestDetail /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
