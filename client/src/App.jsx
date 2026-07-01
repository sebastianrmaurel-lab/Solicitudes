import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { getSession, signOut } from './lib/supabase.js';
import { api } from './lib/api.js';

// Auth Context
const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

// Pages
import LoginPage from './pages/Login.jsx';
import DashboardPage from './pages/Dashboard.jsx';
import RequestsPage from './pages/Requests.jsx';
import RequestDetailPage from './pages/RequestDetail.jsx';
import NewRequestPage from './pages/NewRequest.jsx';
import AdminPage from './pages/Admin.jsx';
import ProfilePage from './pages/Profile.jsx';

function Sidebar({ user, onSignOut }) {
  const location = useLocation();
  const isAdmin = ['admin', 'agent'].includes(user?.role);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">📋 Portal</div>
      <nav className="sidebar-nav">
        <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>🏠 Inicio</Link>
        <Link to="/requests" className={location.pathname.startsWith('/requests') ? 'active' : ''}>📋 Mis Solicitudes</Link>
        <Link to="/requests/new" className={location.pathname === '/requests/new' ? 'active' : ''}>➕ Nueva Solicitud</Link>
        {isAdmin && <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>⚙️ Panel Admin</Link>}
        <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>👤 Mi Perfil</Link>
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <strong>{user?.full_name || user?.email}</strong>
          {user?.role !== 'user' && <span style={{color: 'var(--primary)', fontSize: 12}}>{user?.role}</span>}
        </div>
        <button className="btn btn-outline btn-sm" style={{marginTop: 8, width: '100%'}} onClick={onSignOut}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

function Layout({ children }) {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    setUser(null);
    navigate('/login');
  }

  return (
    <div className="layout">
      <Sidebar user={user} onSignOut={handleSignOut} />
      <main className="main-content">{children}</main>
    </div>
  );
}

function ProtectedRoute({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{padding: 40, textAlign: 'center'}}>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !['admin', 'agent'].includes(user.role)) return <Navigate to="/dashboard" />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const session = await getSession();
      if (session) {
        try {
          const profile = await api.get('/profiles/me');
          setUser(profile);
        } catch {}
      }
      setLoading(false);
    }
    init();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/requests" element={<ProtectedRoute><RequestsPage /></ProtectedRoute>} />
          <Route path="/requests/new" element={<ProtectedRoute><NewRequestPage /></ProtectedRoute>} />
          <Route path="/requests/:id" element={<ProtectedRoute><RequestDetailPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
