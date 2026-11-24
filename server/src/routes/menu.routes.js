const { Router } = require('express');
const { menuController } = require('../controllers/menu.controller');
const { authenticate } = require('../middleware/authenticate.middleware');
const { requireAdmin } = require('../middleware/authorize.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createMenuSchema, addDishSchema } = require('../validators/menu.validators');

const router = Router();

// GET /api/menus — List menus (supports ?date=...&mealType=...)
router.get('/menus', authenticate, menuController.listMenus);

// POST /api/menus — Create a new daily menu with auto-generated slots (MESS_ADMIN only)
router.post(
  '/menus',
  authenticate,
  requireAdmin,
  validate(createMenuSchema),
  menuController.createMenu,
);

// GET /api/menus/:id — Get menu with dishes & slots
router.get('/menus/:id', authenticate, menuController.getMenuById);

// DELETE /api/menus/:id — Delete menu (protected if bookings exist, MESS_ADMIN only)
router.delete('/menus/:id', authenticate, requireAdmin, menuController.deleteMenu);

// POST /api/menus/:id/dishes — Add dish to menu (MESS_ADMIN only)
router.post(
  '/menus/:id/dishes',
  authenticate,
  requireAdmin,
  validate(addDishSchema),
  menuController.addDish,
);

// POST /api/menus/:id/items — Alias for adding dish (MESS_ADMIN only)
router.post(
  '/menus/:id/items',
  authenticate,
  requireAdmin,
  validate(addDishSchema),
  menuController.addDish,
);

// DELETE /api/menus/:id/dishes/:dishId — Remove dish from menu (MESS_ADMIN only)
router.delete(
  '/menus/:id/dishes/:dishId',
  authenticate,
  requireAdmin,
  menuController.removeDish,
);

// DELETE /api/menus/:id/items/:itemId — Alias for removing dish (MESS_ADMIN only)
router.delete(
  '/menus/:id/items/:itemId',
  authenticate,
  requireAdmin,
  menuController.removeDish,
);

module.exports = router;
module.exports.default = router;
