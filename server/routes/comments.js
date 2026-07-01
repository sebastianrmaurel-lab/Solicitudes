import { Router } from 'express';
import { supabase, requireAuth } from '../index.js';

const router = Router();

// GET /api/comments?request_id=xxx
router.get('/', requireAuth, async (req, res) => {
  const { request_id } = req.query;
  if (!request_id) return res.status(400).json({ error: 'request_id requerido' });

  const isStaff = ['admin', 'agent'].includes(req.user.profile?.role);
  let query = supabase
    .from('comments')
    .select('*, user:profiles!comments_user_id_fkey(full_name, email, role, avatar_url)')
    .eq('request_id', request_id)
    .order('created_at', { ascending: true });

  if (!isStaff) query = query.eq('is_internal', false);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/comments
router.post('/', requireAuth, async (req, res) => {
  const { request_id, content, is_internal } = req.body;
  if (!request_id || !content) return res.status(400).json({ error: 'request_id y content requeridos' });

  const isStaff = ['admin', 'agent'].includes(req.user.profile?.role);
  const { data, error } = await supabase
    .from('comments')
    .insert({ request_id, content, user_id: req.user.id, is_internal: isStaff ? !!is_internal : false })
    .select('*, user:profiles!comments_user_id_fkey(full_name, email, role, avatar_url)')
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Notificar al creador de la solicitud
  const { data: request } = await supabase.from('requests').select('user_id, title').eq('id', request_id).single();
  if (request && request.user_id !== req.user.id) {
    await supabase.from('notifications').insert({
      user_id: request.user_id, request_id,
      type: 'new_comment', title: 'Nueva respuesta',
      message: `${req.user.profile?.full_name} respondió tu solicitud "${request.title}"`
    });
  }

  res.status(201).json(data);
});

// DELETE /api/comments/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const { data } = await supabase.from('comments').select('user_id').eq('id', req.params.id).single();
  if (!data) return res.status(404).json({ error: 'No encontrado' });

  const isAdmin = req.user.profile?.role === 'admin';
  if (data.user_id !== req.user.id && !isAdmin) return res.status(403).json({ error: 'Acceso denegado' });

  await supabase.from('comments').delete().eq('id', req.params.id);
  res.json({ success: true });
});

export default router;
