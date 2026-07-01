import { Router } from 'express';
import { supabaseAdmin, requireAuth, requireAdmin } from '../index.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('profiles').select('*').order('created_at');
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { email, password, full_name, role, area } = req.body;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name }
    });
    if (authError) throw authError;
    await supabaseAdmin.from('profiles').update({ role, area, full_name }).eq('id', authData.user.id);
    res.status(201).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const { role, area, full_name, active } = req.body;
    const updates = {};
    if (role !== undefined) updates.role = role;
    if (area !== undefined) updates.area = area;
    if (full_name !== undefined) updates.full_name = full_name;
    if (active !== undefined) updates.active = active;
    const { data, error } = await supabaseAdmin.from('profiles').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('categories').select('*').order('area').order('name');
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { name, area, description } = req.body;
    const { data, error } = await supabaseAdmin.from('categories').insert({ name, area, description }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/categories/:id', async (req, res) => {
  try {
    const { name, area, description, active } = req.body;
    const { data, error } = await supabaseAdmin.from('categories').update({ name, area, description, active }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('categories').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
