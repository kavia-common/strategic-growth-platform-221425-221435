const supabase = require('../services/supabaseService');

/**
 * Middleware to check if user has specific role in the current org
 * Requires requireAuth to run first to set req.user and req.orgId
 * @param {string[]} allowedRoles - Array of allowed roles e.g. ['owner', 'admin']
 */
const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const orgId = req.orgId || req.params.orgId; // Prioritize param if route has it, else header

      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required for this operation' });
      }

      // Query organization_members to check role
      const { data, error } = await supabase
        .from('organization_members')
        .select('role')
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return res.status(403).json({ error: 'Access denied. Not a member of this organization.' });
      }

      if (!allowedRoles.includes(data.role)) {
        return res.status(403).json({ error: `Access denied. Requires one of: ${allowedRoles.join(', ')}` });
      }

      next();
    } catch (err) {
      console.error('RBAC middleware error:', err);
      res.status(500).json({ error: 'Internal server error during authorization' });
    }
  };
};

module.exports = { requireRole };
