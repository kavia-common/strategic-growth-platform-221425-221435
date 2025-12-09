const express = require('express');
const orgsController = require('../controllers/orgsController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

/**
 * @swagger
 * /orgs:
 *   get:
 *     summary: List user organizations
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Create new organization
 *     security:
 *       - bearerAuth: []
 */
router.get('/', requireAuth, orgsController.list);
router.post('/', requireAuth, orgsController.create);

/**
 * @swagger
 * /orgs/{orgId}/members:
 *   post:
 *     summary: Add member to org
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 */
router.post('/:orgId/members', requireAuth, requireRole(['owner', 'admin']), orgsController.addMember);

/**
 * @swagger
 * /orgs/{orgId}/members/{userId}:
 *   patch:
 *     summary: Update member role
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *       - in: path
 *         name: userId
 *         required: true
 */
router.patch('/:orgId/members/:userId', requireAuth, requireRole(['owner']), orgsController.updateMember);

module.exports = router;
