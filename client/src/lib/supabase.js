// Simple auth — no Supabase needed
const BASE = '/api';

export async function signIn(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Credenciales incorrectas');
  const data = await res.json();
  localStorage.setItem('sb-token', data.token);
  return data;
}

export async function signOut() {
  const token = localStorage.getItem('sb-token');
  if (token) {
    await fetch(`${BASE}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
  localStorage.removeItem('sb-token');
}

export async function getSession() {
  const token = localStorage.getItem('sb-token');
  if (!token) return null;
  return { user: { token } };
}
