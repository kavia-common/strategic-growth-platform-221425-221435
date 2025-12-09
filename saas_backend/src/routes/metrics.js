const express = require('express');
const metricsController = require('../controllers/metricsController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /metrics/summary:
 *   get:
 *     summary: Get dashboard metrics summary
 *     security:
 *       - bearerAuth: []
 */
router.get('/summary', requireAuth, metricsController.getSummary);

/**
 * @swagger
 * /metrics/ingest:
 *   post:
 *     summary: Ingest metric (Admin only in real app, simplified here)
 *     security:
 *       - bearerAuth: []
 */
router.post('/ingest', requireAuth, metricsController.ingest);

module.exports = router;
