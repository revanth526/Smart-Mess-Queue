const { Router } = require('express');
const { menuItemController } = require('../controllers/menuItem.controller');
const { authenticate } = require('../middleware/authenticate.middleware');
const { authorize } = require('../middleware/authorize.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  createMenuItemSchema,
  updateMenuItemSchema,
  updateMenuItemStatusSchema,
} = require('../validators/menuItem.validators');
const { Role } = require('@prisma/client');

const router = Router();

// GET /api/menu-items — List items
router.get('/menu-items', authenticate, menuItemController.listMenuItems);

// POST /api/menu-items — Create item (MESS_ADMIN only)
router.post(
  '/menu-items',
  authenticate,
  authorize(Role.MESS_ADMIN),
  validate(createMenuItemSchema),
  menuItemController.createMenuItem,
);

// GET /api/menu-items/:id — Get item details
router.get('/menu-items/:id', authenticate, menuItemController.getMenuItemById);

// PATCH & PUT /api/menu-items/:id — Update item (MESS_ADMIN only)
router.patch(
  '/menu-items/:id',
  authenticate,
  authorize(Role.MESS_ADMIN),
  validate(updateMenuItemSchema),
  menuItemController.updateMenuItem,
);
router.put(
  '/menu-items/:id',
  authenticate,
  authorize(Role.MESS_ADMIN),
  validate(updateMenuItemSchema),
  menuItemController.updateMenuItem,
);

// PATCH /api/menu-items/:id/status — Toggle availability (MESS_ADMIN only)
router.patch(
  '/menu-items/:id/status',
  authenticate,
  authorize(Role.MESS_ADMIN),
  validate(updateMenuItemStatusSchema),
  menuItemController.updateMenuItemStatus,
);

// DELETE /api/menu-items/:id — Delete item if unused in past menus (MESS_ADMIN only)
router.delete(
  '/menu-items/:id',
  authenticate,
  authorize(Role.MESS_ADMIN),
  menuItemController.deleteMenuItem,
);

module.exports = router;
module.exports.default = router;
