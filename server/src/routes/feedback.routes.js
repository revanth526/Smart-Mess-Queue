const { Router } = require('express');
const { feedbackController } = require('../controllers/feedback.controller');
const { authenticate } = require('../middleware/authenticate.middleware');
const { authorize } = require('../middleware/authorize.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  createFeedbackSchema,
  updateFeedbackSchema,
  getFeedbackByIdSchema,
  listFeedbackSchema,
  feedbackAnalyticsSchema,
  operationalMetricsSchema,
} = require('../validators/feedback.validators');
const { Role } = require('@prisma/client');

const router = Router();

// ── Student Endpoints ──────────────────────────────────────────

// POST /api/feedback — Submit rating and comment for completed meal (STUDENT only)
router.post(
  '/',
  authenticate,
  authorize(Role.STUDENT),
  validate(createFeedbackSchema),
  feedbackController.createFeedback,
);

// GET /api/feedback/my — View all feedback submitted by current student (STUDENT only)
router.get('/my', authenticate, authorize(Role.STUDENT), feedbackController.getMyFeedback);

// ── Admin Endpoints (via /api/admin/feedback or /api/feedback) ──

// GET /api/feedback/analytics & summary — Aggregate feedback analytics (MESS_ADMIN only)
// NOTE: Defined before `/:id`
router.get(
  '/analytics',
  authenticate,
  authorize(Role.MESS_ADMIN),
  validate(feedbackAnalyticsSchema),
  feedbackController.getAnalytics,
);

router.get(
  '/summary',
  authenticate,
  authorize(Role.MESS_ADMIN),
  validate(feedbackAnalyticsSchema),
  feedbackController.getAnalytics,
);

router.get(
  '/operational-metrics',
  authenticate,
  authorize(Role.MESS_ADMIN),
  validate(operationalMetricsSchema),
  feedbackController.getOperationalMetrics,
);

// GET /api/feedback — List all feedbacks with filters (MESS_ADMIN only)
router.get(
  '/',
  authenticate,
  authorize(Role.MESS_ADMIN),
  validate(listFeedbackSchema),
  feedbackController.listAdminFeedback,
);

// ── Shared Single Item Endpoints ───────────────────────────────

// GET /api/feedback/:id — View single feedback (Author student or MESS_ADMIN)
router.get(
  '/:id',
  authenticate,
  validate(getFeedbackByIdSchema),
  feedbackController.getFeedbackById,
);

// PATCH /api/feedback/:id — Update rating/comment (STUDENT author only)
router.patch(
  '/:id',
  authenticate,
  authorize(Role.STUDENT),
  validate(updateFeedbackSchema),
  feedbackController.updateFeedback,
);

// DELETE /api/feedback/:id — Delete/moderate feedback (Author student or MESS_ADMIN)
router.delete('/:id', authenticate, feedbackController.deleteFeedback);

module.exports = router;
module.exports.default = router;
