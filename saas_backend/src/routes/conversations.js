const express = require('express');
const conversationsController = require('../controllers/conversationsController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /conversations:
 *   get:
 *     summary: List conversations
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Create conversation
 *     security:
 *       - bearerAuth: []
 */
router.get('/', requireAuth, conversationsController.list);
router.post('/', requireAuth, conversationsController.create);

/**
 * @swagger
 * /conversations/{id}/messages:
 *   get:
 *     summary: Get messages for conversation
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/messages', requireAuth, conversationsController.getMessages);

module.exports = router;
