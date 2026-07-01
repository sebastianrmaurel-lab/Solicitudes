import { Router } from 'express';
import { supabaseAdmin, requireAuth } from '../index.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    let query = supabaseAdmin.from('requests').select('status, priority, category_id, categories(area)', { count: 'exact' });
    if (req.profile.role === 'user') query = query.eq('user_id', req.user.id);
    else if (req.profile.role === 'agent') query = query.eq('categories.area', req.profile.area);

    const { data, error } = await query;
    if (error) throw error;

    const stats = {
      total: data.length,
      open: data.filter(r => r.status === 'open').length,
      in_progress: data.filter(r => r.status === 'in_progress').length,
      resolved: data.filter(r => r.status === 'resolved').length,
      closed: data.filter(r => r.status === 'closed').length,
      by_priority: {
        low: data.filter(r => r.priority === 'low').length,
        medium: data.filter(r => r.priority === 'medium').length,
        high: data.filter(r => r.priority === 'high').length,
        urgent: data.filter(r => r.priority === 'urgent').length,
      }
    };
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
