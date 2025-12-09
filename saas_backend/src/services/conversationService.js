const supabase = require('./supabaseService');

class ConversationService {
  async list(userId, orgId = null) {
    let query = supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (orgId) {
      query = query.eq('org_id', orgId);
      // RLS will ensure user is member
    } else {
      // Personal
      query = query.is('org_id', null).eq('created_by', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async create(userId, title, orgId = null) {
    const { data, error } = await supabase
      .from('conversations')
      .insert({ created_by: userId, org_id: orgId, title })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getById(conversationId) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getMessages(conversationId) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  async addMessage(conversationId, senderId, role, content) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, role, content })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update conversation timestamp
    await supabase.from('conversations')
      .update({ updated_at: new Date() })
      .eq('id', conversationId);
      
    return data;
  }
}

module.exports = new ConversationService();
