const supabase = require('./supabaseService');

class MetricsService {
  async getSummary(orgId) {
    const { data, error } = await supabase
      .from('dashboard_metrics')
      .select('*')
      .eq('org_id', orgId)
      .order('ts', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data;
  }

  async ingestMetric(orgId, key, value) {
    const { data, error } = await supabase
      .from('dashboard_metrics')
      .insert({ org_id: orgId, metric_key: key, metric_value: value })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

module.exports = new MetricsService();
