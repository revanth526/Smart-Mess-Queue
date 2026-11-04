import { Router } from 'express';
import { menuController } from '../controllers/menu.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import { createMenuSchema, addDishSchema } from '../validators/menu.validators';
import { Role } from '@prisma/client';

const router = Router();

// GET /api/menus — List menus (supports ?date=...&mealType=...)
router.get('/menus', authenticate, menuController.listMenus);

// POST /api/menus — Create a new daily menu with auto-generated slots (MESS_ADMIN only)
router.post(
  '/menus',
  authenticate,
  authorize(Role.MESS_ADMIN),
  validate(createMenuSchema),
  menuController.createMenu,
);

// GET /api/menus/:id — Get menu with dishes & slots
router.get('/menus/:id', authenticate, menuController.getMenuById);

// DELETE /api/menus/:id — Delete menu (protected if bookings exist, MESS_ADMIN only)
router.delete('/menus/:id', authenticate, authorize(Role.MESS_ADMIN), menuController.deleteMenu);

// POST /api/menus/:id/dishes — Add dish to menu (MESS_ADMIN only)
router.post(
  '/menus/:id/dishes',
  authenticate,
  authorize(Role.MESS_ADMIN),
  validate(addDishSchema),
  menuController.addDish,
);

// POST /api/menus/:id/items — Alias for adding dish (MESS_ADMIN only)
router.post(
  '/menus/:id/items',
  authenticate,
  authorize(Role.MESS_ADMIN),
  validate(addDishSchema),
  menuController.addDish,
);

// DELETE /api/menus/:id/dishes/:dishId — Remove dish from menu (MESS_ADMIN only)
router.delete(
  '/menus/:id/dishes/:dishId',
  authenticate,
  authorize(Role.MESS_ADMIN),
  menuController.removeDish,
);

// DELETE /api/menus/:id/items/:itemId — Alias for removing dish (MESS_ADMIN only)
router.delete(
  '/menus/:id/items/:itemId',
  authenticate,
  authorize(Role.MESS_ADMIN),
  menuController.removeDish,
);

export default router;
