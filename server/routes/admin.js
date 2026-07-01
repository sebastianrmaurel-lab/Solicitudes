import { Router } from 'express';
import { supabase, requireAuth, requireAdmin } from '../index.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// Listar todos los usuarios
router.get('/users', async (req, res) => {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Cambiar rol de usuario
router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin', 'agent'].includes(role)) return res.status(400).json({ error: 'Rol inválido' });
  const { data, error } = await supabase.from('profiles').update({ role }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Categorías CRUD
router.get('/categories', async (req, res) => {
  const { data } = await supabase.from('categories').select('*').order('name');
  res.json(data);
});

router.post('/categories', async (req, res) => {
  const { name, description, color, icon } = req.body;
  const { data, error } = await supabase.from('categories').insert({ name, description, color, icon }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/categories/:id', async (req, res) => {
  const { data, error } = await supabase.from('categories').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/categories/:id', async (req, res) => {
  await supabase.from('categories').delete().eq('id', req.params.id);
  res.json({ success: true });
});

export default router;
