const supabase = require('./supabaseService');

class OrgService {
  async listUserOrgs(userId) {
    const { data, error } = await supabase
      .from('organization_members')
      .select('role, org_id, organizations(id, name, created_at)')
      .eq('user_id', userId);
    
    if (error) throw error;
    // Flatten structure
    return data.map(item => ({
      role: item.role,
      ...item.organizations
    }));
  }

  async createOrg(userId, name) {
    // We use the RPC function defined in functions.sql for atomic creation
    const { data, error } = await supabase.rpc('create_org_with_owner', {
      org_name: name
    });

    if (error) throw error;
    return { id: data, name }; // RPC returns uuid
  }

  async addMember(orgId, userId, role = 'member') {
    // This is a placeholder as per requirements (invite flow is complex)
    // Direct insert for demo purposes
    const { data, error } = await supabase
      .from('organization_members')
      .insert({ org_id: orgId, user_id: userId, role })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateMemberRole(orgId, targetUserId, newRole) {
    const { data, error } = await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('org_id', orgId)
      .eq('user_id', targetUserId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = new OrgService();
