const express = require('express');
const messagesController = require('../controllers/messagesController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /conversations/{id}/messages:
 *   post:
 *     summary: Post user message and get AI response
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/messages', requireAuth, messagesController.create);

module.exports = router;
