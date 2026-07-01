import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// ── IN-MEMORY DATA ──────────────────────────────────────────
const AREAS = ['rem','ing','sis','ctrl'];

let users = [
  { id:'u1', email:'admin@empresa.com',   password:'admin123',  full_name:'Ana García',    role:'admin', area:null,   active:true },
  { id:'u2', email:'rem@empresa.com',     password:'rem123',    full_name:'Carlos López',  role:'agent', area:'rem',  active:true },
  { id:'u3', email:'ing@empresa.com',     password:'ing123',    full_name:'Paula Soto',    role:'agent', area:'ing',  active:true },
  { id:'u4', email:'sis@empresa.com',     password:'sis123',    full_name:'Luis Herrera',  role:'agent', area:'sis',  active:true },
  { id:'u5', email:'ctrl@empresa.com',    password:'ctrl123',   full_name:'Carla Muñoz',   role:'agent', area:'ctrl', active:true },
  { id:'u6', email:'user@empresa.com',    password:'user123',   full_name:'María Rodríguez',role:'user', area:null,   active:true },
];

let categories = [
  { id:'c1', name:'Liquidaciones de sueldo', area:'rem',  active:true },
  { id:'c2', name:'Bonos y beneficios',       area:'rem',  active:true },
  { id:'c3', name:'Descuentos',               area:'rem',  active:true },
  { id:'c4', name:'Carga de documentos',      area:'ing',  active:true },
  { id:'c5', name:'Actualización de datos',   area:'ing',  active:true },
  { id:'c6', name:'Errores del sistema',      area:'sis',  active:true },
  { id:'c7', name:'Accesos y permisos',       area:'sis',  active:true },
  { id:'c8', name:'Seguimiento',              area:'ctrl', active:true },
  { id:'c9', name:'Reclamos',                 area:'ctrl', active:true },
];

let requests = [];
let comments = [];
let sessions = {}; // token -> userId

function uid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }

// ── AUTH ─────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const userId = sessions[token];
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  req.currentUser = users.find(u => u.id === userId);
  if (!req.currentUser || !req.currentUser.active) return res.status(401).json({ error: 'Usuario inactivo' });
  next();
}

function requireAdmin(req, res, next) {
  if (req.currentUser?.role !== 'admin') return res.status(403).json({ error: 'Solo admin' });
  next();
}

function requireStaff(req, res, next) {
  if (!['admin','agent'].includes(req.currentUser?.role)) return res.status(403).json({ error: 'Solo staff' });
  next();
}

// ── LOGIN ────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password && u.active);
  if (!user) return res.status(401).json({ error: 'Credenciales incorrectas' });
  const token = crypto.randomBytes(32).toString('hex');
  sessions[token] = user.id;
  const { password: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  delete sessions[token];
  res.json({ ok: true });
});

app.get('/api/profile', requireAuth, (req, res) => {
  const { password: _, ...safe } = req.currentUser;
  res.json(safe);
});

// ── REQUESTS ─────────────────────────────────────────────────
app.get('/api/requests', requireAuth, (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  let list = [...requests];

  if (req.currentUser.role === 'user') list = list.filter(r => r.user_id === req.currentUser.id);
  else if (req.currentUser.role === 'agent') {
    const areaCats = categories.filter(c => c.area === req.currentUser.area).map(c => c.id);
    list = list.filter(r => areaCats.includes(r.category_id));
  }

  if (status) list = list.filter(r => r.status === status);
  if (search) list = list.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));

  list = list.sort((a,b) => b.created_at.localeCompare(a.created_at));
  const total = list.length;
  const data = list.slice((page-1)*limit, page*limit).map(r => enrich(r));
  res.json({ data, count: total, page: Number(page) });
});

app.get('/api/requests/:id', requireAuth, (req, res) => {
  const r = requests.find(r => r.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'No encontrado' });
  if (req.currentUser.role === 'user' && r.user_id !== req.currentUser.id) return res.status(403).json({ error: 'Forbidden' });
  res.json({ ...enrich(r), comments: comments.filter(c => c.request_id === r.id && (req.currentUser.role !== 'user' || !c.is_internal)) });
});

app.post('/api/requests', requireAuth, (req, res) => {
  const { title, description, category_id, type = 'question', priority = 'medium' } = req.body;
  if (!title || !category_id) return res.status(400).json({ error: 'Faltan campos' });
  const r = { id: uid(), title, description, category_id, type, priority, status: 'open', user_id: req.currentUser.id, created_at: now(), updated_at: now() };
  requests.push(r);
  res.status(201).json(enrich(r));
});

app.patch('/api/requests/:id', requireAuth, (req, res) => {
  const r = requests.find(r => r.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'No encontrado' });
  if (['admin','agent'].includes(req.currentUser.role)) {
    const { status, priority, assigned_to } = req.body;
    if (status) r.status = status;
    if (priority) r.priority = priority;
    if (assigned_to) r.assigned_to = assigned_to;
  } else if (r.user_id === req.currentUser.id && r.status === 'open') {
    const { title, description } = req.body;
    if (title) r.title = title;
    if (description) r.description = description;
  } else return res.status(403).json({ error: 'Forbidden' });
  r.updated_at = now();
  res.json(enrich(r));
});

app.delete('/api/requests/:id', requireAuth, requireAdmin, (req, res) => {
  const idx = requests.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
  requests.splice(idx, 1);
  res.json({ ok: true });
});

// ── COMMENTS ─────────────────────────────────────────────────
app.get('/api/comments', requireAuth, (req, res) => {
  const { request_id } = req.query;
  let list = comments.filter(c => c.request_id === request_id);
  if (req.currentUser.role === 'user') list = list.filter(c => !c.is_internal);
  res.json(list.map(c => ({ ...c, profiles: { full_name: users.find(u=>u.id===c.user_id)?.full_name } })));
});

app.post('/api/comments', requireAuth, (req, res) => {
  const { request_id, content, is_internal = false } = req.body;
  const c = { id: uid(), request_id, content, user_id: req.currentUser.id, is_internal: ['admin','agent'].includes(req.currentUser.role) ? is_internal : false, created_at: now() };
  comments.push(c);
  res.status(201).json(c);
});

app.delete('/api/comments/:id', requireAuth, (req, res) => {
  const idx = comments.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
  if (comments[idx].user_id !== req.currentUser.id && req.currentUser.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  comments.splice(idx, 1);
  res.json({ ok: true });
});

// ── STATS ─────────────────────────────────────────────────────
app.get('/api/stats', requireAuth, (req, res) => {
  let list = [...requests];
  if (req.currentUser.role === 'user') list = list.filter(r => r.user_id === req.currentUser.id);
  else if (req.currentUser.role === 'agent') {
    const areaCats = categories.filter(c => c.area === req.currentUser.area).map(c => c.id);
    list = list.filter(r => areaCats.includes(r.category_id));
  }
  res.json({
    total: list.length,
    open: list.filter(r=>r.status==='open').length,
    in_progress: list.filter(r=>r.status==='in_progress').length,
    resolved: list.filter(r=>r.status==='resolved').length,
    closed: list.filter(r=>r.status==='closed').length,
  });
});

// ── ADMIN ─────────────────────────────────────────────────────
app.get('/api/admin/categories', requireAuth, (req, res) => res.json(categories));

app.post('/api/admin/categories', requireAuth, requireAdmin, (req, res) => {
  const { name, area, description } = req.body;
  const c = { id: uid(), name, area, description, active: true, created_at: now() };
  categories.push(c);
  res.status(201).json(c);
});

app.delete('/api/admin/categories/:id', requireAuth, requireAdmin, (req, res) => {
  const idx = categories.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
  categories.splice(idx, 1);
  res.json({ ok: true });
});

app.get('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
  res.json(users.map(({ password: _, ...u }) => u));
});

app.post('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
  const { email, password, full_name, role, area } = req.body;
  if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email ya existe' });
  const u = { id: uid(), email, password, full_name, role, area: role === 'agent' ? area : null, active: true, created_at: now() };
  users.push(u);
  const { password: _, ...safe } = u;
  res.status(201).json(safe);
});

app.patch('/api/admin/users/:id', requireAuth, requireAdmin, (req, res) => {
  const u = users.find(u => u.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'No encontrado' });
  const { full_name, role, area, active, password } = req.body;
  if (full_name !== undefined) u.full_name = full_name;
  if (role !== undefined) u.role = role;
  if (area !== undefined) u.area = area;
  if (active !== undefined) u.active = active;
  if (password) u.password = password;
  const { password: _, ...safe } = u;
  res.json(safe);
});

// ── HELPERS ───────────────────────────────────────────────────
function enrich(r) {
  const cat = categories.find(c => c.id === r.category_id);
  const user = users.find(u => u.id === r.user_id);
  return { ...r, category_name: cat?.name, area: cat?.area, user_full_name: user?.full_name };
}

// Serve frontend
const distPath = join(__dirname, '../client/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(join(distPath, 'index.html')));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✓ Servidor corriendo en puerto ${PORT}`));
