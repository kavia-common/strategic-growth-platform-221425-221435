const orgService = require('../services/orgService');
const { z } = require('zod');

const createOrgSchema = z.object({
  name: z.string().min(1)
});

const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['owner', 'admin', 'member']).optional()
});

const updateMemberSchema = z.object({
  role: z.enum(['owner', 'admin', 'member'])
});

class OrgsController {
  // PUBLIC_INTERFACE
  async list(req, res) {
    try {
      const orgs = await orgService.listUserOrgs(req.user.id);
      res.json(orgs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // PUBLIC_INTERFACE
  async create(req, res) {
    try {
      const { name } = createOrgSchema.parse(req.body);
      const org = await orgService.createOrg(req.user.id, name);
      res.status(201).json(org);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      res.status(500).json({ error: error.message });
    }
  }

  // PUBLIC_INTERFACE
  async addMember(req, res) {
    try {
      const { orgId } = req.params;
      const { userId, role } = addMemberSchema.parse(req.body);
      const member = await orgService.addMember(orgId, userId, role);
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      res.status(500).json({ error: error.message });
    }
  }

  // PUBLIC_INTERFACE
  async updateMember(req, res) {
    try {
      const { orgId, userId } = req.params;
      const { role } = updateMemberSchema.parse(req.body);
      const member = await orgService.updateMemberRole(orgId, userId, role);
      res.json(member);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new OrgsController();
