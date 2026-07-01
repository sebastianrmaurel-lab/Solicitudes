import { Router } from 'express';
import { supabaseAdmin, requireAuth } from '../index.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { request_id } = req.query;
    if (!request_id) return res.status(400).json({ error: 'request_id required' });
    let query = supabaseAdmin.from('comments').select('*, profiles(full_name,role)').eq('request_id', request_id).order('created_at');
    if (!['admin','agent'].includes(req.profile.role)) {
      query = query.eq('is_internal', false);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { request_id, content, is_internal = false } = req.body;
    const { data, error } = await supabaseAdmin.from('comments').insert({
      request_id, content,
      user_id: req.user.id,
      is_internal: ['admin','agent'].includes(req.profile.role) ? is_internal : false
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { data: comment } = await supabaseAdmin.from('comments').select('*').eq('id', req.params.id).single();
    if (!comment) return res.status(404).json({ error: 'Not found' });
    if (comment.user_id !== req.user.id && req.profile.role !== 'admin')
      return res.status(403).json({ error: 'Forbidden' });
    const { error } = await supabaseAdmin.from('comments').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
