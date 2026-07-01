import { Router } from 'express';
import { supabase, requireAuth } from '../index.js';

const router = Router();

// GET /api/requests - listar solicitudes
router.get('/', requireAuth, async (req, res) => {
  const { status, category_id, type, priority, page = 1, limit = 20, search } = req.query;
  const isStaff = ['admin', 'agent'].includes(req.user.profile?.role);

  let query = supabase
    .from('requests_with_details')
    .select('*')
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (!isStaff) query = query.eq('user_id', req.user.id);
  if (status) query = query.eq('status', status);
  if (category_id) query = query.eq('category_id', category_id);
  if (type) query = query.eq('type', type);
  if (priority) query = query.eq('priority', priority);
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, count, page: Number(page), limit: Number(limit) });
});

// GET /api/requests/:id
router.get('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('requests_with_details')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'No encontrado' });

  const isOwner = data.user_id === req.user.id;
  const isStaff = ['admin', 'agent'].includes(req.user.profile?.role);
  if (!isOwner && !isStaff) return res.status(403).json({ error: 'Acceso denegado' });

  // Historial de estados
  const { data: history } = await supabase
    .from('status_history')
    .select('*, changed_by_profile:profiles!status_history_changed_by_fkey(full_name)')
    .eq('request_id', req.params.id)
    .order('created_at', { ascending: true });

  res.json({ ...data, status_history: history });
});

// POST /api/requests
router.post('/', requireAuth, async (req, res) => {
  const { title, description, type, priority, category_id, tags } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Título y descripción requeridos' });

  const { data, error } = await supabase
    .from('requests')
    .insert({ title, description, type: type || 'request', priority: priority || 'medium',
      category_id, tags, user_id: req.user.id })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/requests/:id
router.patch('/:id', requireAuth, async (req, res) => {
  const { title, description, type, priority, category_id, status, assigned_to, tags } = req.body;
  const isStaff = ['admin', 'agent'].includes(req.user.profile?.role);

  // Verificar acceso
  const { data: existing } = await supabase.from('requests').select('user_id').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'No encontrado' });
  if (existing.user_id !== req.user.id && !isStaff) return res.status(403).json({ error: 'Acceso denegado' });

  const updates = {};
  if (title) updates.title = title;
  if (description) updates.description = description;
  if (type) updates.type = type;
  if (priority) updates.priority = priority;
  if (category_id !== undefined) updates.category_id = category_id;
  if (tags) updates.tags = tags;
  if (isStaff && status) {
    updates.status = status;
    if (status === 'resolved') updates.resolved_at = new Date().toISOString();
  }
  if (isStaff && assigned_to !== undefined) updates.assigned_to = assigned_to;

  const { data, error } = await supabase.from('requests').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/requests/:id (solo admins)
router.delete('/:id', requireAuth, async (req, res) => {
  if (req.user.profile?.role !== 'admin') return res.status(403).json({ error: 'Solo admins' });
  const { error } = await supabase.from('requests').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
