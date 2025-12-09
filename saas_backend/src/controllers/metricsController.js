const metricsService = require('../services/metricsService');
const { z } = require('zod');

const ingestSchema = z.object({
  orgId: z.string().uuid(),
  key: z.string(),
  value: z.record(z.any())
});

class MetricsController {
  // PUBLIC_INTERFACE
  async getSummary(req, res) {
    try {
      const orgId = req.query.orgId || req.headers['x-org-id'];
      if (!orgId) return res.status(400).json({ error: 'Org ID required' });
      
      const data = await metricsService.getSummary(orgId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // PUBLIC_INTERFACE
  async ingest(req, res) {
    try {
      const { orgId, key, value } = ingestSchema.parse(req.body);
      const data = await metricsService.ingestMetric(orgId, key, value);
      res.status(201).json(data);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new MetricsController();
