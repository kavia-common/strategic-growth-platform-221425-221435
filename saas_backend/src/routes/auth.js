const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /auth/session:
 *   post:
 *     summary: Validate session and get profile info
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile and org memberships
 */
router.post('/session', requireAuth, authController.validateSession);

module.exports = router;
