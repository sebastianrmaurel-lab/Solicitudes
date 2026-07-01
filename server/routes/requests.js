import { Router } from 'express';
import { supabaseAdmin, requireAuth, requireStaff } from '../index.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { status, category_id, search, page = 1, limit = 20 } = req.query;
    let query = supabaseAdmin
      .from('requests_with_details')
      .select('*', { count: 'exact' });

    if (req.profile.role === 'user') {
      query = query.eq('user_id', req.user.id);
    } else if (req.profile.role === 'agent') {
      query = query.eq('area', req.profile.area);
    }

    if (status) query = query.eq('status', status);
    if (category_id) query = query.eq('category_id', category_id);
    if (search) query = query.ilike('title', `%${search}%`);

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1).order('created_at', { ascending: false });

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ data, count, page: Number(page), limit: Number(limit) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('requests_with_details')
      .select('*, status_history(*), comments(*)')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found' });
    if (req.profile.role === 'user' && data.user_id !== req.user.id)
      return res.status(403).json({ error: 'Forbidden' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, category_id, type, priority } = req.body;
    const { data, error } = await supabaseAdmin.from('requests').insert({
      title, description, category_id, type, priority,
      user_id: req.user.id,
      status: 'open'
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { data: existing } = await supabaseAdmin.from('requests').select('*').eq('id', req.params.id).single();
    if (!existing) return res.status(404).json({ error: 'Not found' });

    let updates = {};
    if (['admin','agent'].includes(req.profile.role)) {
      const { status, assigned_to, priority } = req.body;
      if (status) updates.status = status;
      if (assigned_to) updates.assigned_to = assigned_to;
      if (priority) updates.priority = priority;
    } else if (existing.user_id === req.user.id && existing.status === 'open') {
      const { title, description } = req.body;
      if (title) updates.title = title;
      if (description) updates.description = description;
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { data, error } = await supabaseAdmin.from('requests').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', requireStaff, async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('requests').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
