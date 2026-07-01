import { Router } from 'express';
import { supabase, requireAuth, requireAdmin } from '../index.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/', async (req, res) => {
  const [total, open, in_progress, resolved, byCategory, byPriority] = await Promise.all([
    supabase.from('requests').select('id', { count: 'exact', head: true }),
    supabase.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'resolved'),
    supabase.from('requests').select('category_id, categories(name)').not('category_id', 'is', null),
    supabase.from('requests').select('priority'),
  ]);

  // Agrupar por categoría
  const categoryMap = {};
  (byCategory.data || []).forEach(r => {
    const name = r.categories?.name || 'Sin categoría';
    categoryMap[name] = (categoryMap[name] || 0) + 1;
  });

  const priorityMap = {};
  (byPriority.data || []).forEach(r => {
    priorityMap[r.priority] = (priorityMap[r.priority] || 0) + 1;
  });

  res.json({
    total: total.count,
    open: open.count,
    in_progress: in_progress.count,
    resolved: resolved.count,
    by_category: Object.entries(categoryMap).map(([name, count]) => ({ name, count })),
    by_priority: Object.entries(priorityMap).map(([name, count]) => ({ name, count })),
  });
});

export default router;
