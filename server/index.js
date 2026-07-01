import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// Auth middleware
export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });
  const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', user.id).single();
  req.user = user;
  req.profile = profile;
  next();
}

export async function requireStaff(req, res, next) {
  if (!req.profile || !['admin','agent'].includes(req.profile.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

export async function requireAdmin(req, res, next) {
  if (!req.profile || req.profile.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

// Routes
import requestsRouter from './routes/requests.js';
import commentsRouter from './routes/comments.js';
import adminRouter from './routes/admin.js';
import statsRouter from './routes/stats.js';

app.use('/api/requests', requestsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/stats', statsRouter);

app.get('/api/profile', requireAuth, (req, res) => {
  res.json(req.profile);
});

// Serve frontend in production
const distPath = join(__dirname, '../client/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(join(distPath, 'index.html')));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
