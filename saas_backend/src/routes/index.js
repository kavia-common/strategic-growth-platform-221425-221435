const express = require('express');
const healthController = require('../controllers/health');
const authRoutes = require('./auth');
const orgsRoutes = require('./orgs');
const conversationRoutes = require('./conversations');
const messageRoutes = require('./messages');
const metricsRoutes = require('./metrics');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/orgs', orgsRoutes);
router.use('/conversations', conversationRoutes);
// Note: message creation is nested under conversations in the routes file definition, but we can mount it at root level if paths match or mount under conversations.
// The Messages routes are defined as /:id/messages, but to keep it clean, let's mount it at root and the path will be /conversations/:id/messages
router.use('/conversations', messageRoutes); 
router.use('/metrics', metricsRoutes);

// Health endpoint

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health endpoint
 *     responses:
 *       200:
 *         description: Service health check passed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Service is healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: development
 */
router.get('/', healthController.check.bind(healthController));

module.exports = router;
