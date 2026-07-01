import { Router } from 'express';
import { supabase, requireAuth } from '../index.js';

const router = Router();

router.get('/me', requireAuth, async (req, res) => {
  const { data } = await supabase.from('profiles').select('*').eq('id', req.user.id).single();
  res.json(data);
});

router.patch('/me', requireAuth, async (req, res) => {
  const { full_name, department, avatar_url } = req.body;
  const { data, error } = await supabase
    .from('profiles').update({ full_name, department, avatar_url })
    .eq('id', req.user.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/notifications', requireAuth, async (req, res) => {
  const { data } = await supabase
    .from('notifications').select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false }).limit(50);
  res.json(data);
});

router.patch('/notifications/read', requireAuth, async (req, res) => {
  await supabase.from('notifications').update({ is_read: true })
    .eq('user_id', req.user.id).eq('is_read', false);
  res.json({ success: true });
});

export default router;
