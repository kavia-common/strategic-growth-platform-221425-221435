const supabase = require('../services/supabaseService');

class AuthController {
  // PUBLIC_INTERFACE
  async validateSession(req, res) {
    try {
      const user = req.user;

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Fetch org memberships
      const { data: memberships } = await supabase
        .from('organization_members')
        .select('role, org_id, organizations(name)')
        .eq('user_id', user.id);

      return res.status(200).json({
        user,
        profile,
        memberships
      });
    } catch (error) {
      console.error('Validate Session Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = new AuthController();
