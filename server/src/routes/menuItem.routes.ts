import { Router } from 'express';
import { menuItemController } from '../controllers/menuItem.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  updateMenuItemStatusSchema,
} from '../validators/menuItem.validators';
import { Role } from '@prisma/client';

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

// PATCH /api/menu-items/:id — Update item (MESS_ADMIN only)
router.patch(
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

export default router;
