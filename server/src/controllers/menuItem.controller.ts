import { Request, Response, NextFunction } from 'express';
import { menuItemService } from '../services/menuItem.service';
import { sendSuccess } from '../utils/apiResponse';

export class MenuItemController {
  async listMenuItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const messId = req.query.messId as string | undefined;
      const isAvailable =
        req.query.isAvailable !== undefined ? req.query.isAvailable === 'true' : undefined;
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;

      const items = await menuItemService.listItems(messId, {
        isAvailable,
        category,
        search,
      });

      sendSuccess({ res, data: { menuItems: items } });
    } catch (error) {
      next(error);
    }
  }

  async getMenuItemById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await menuItemService.getItemById(String(req.params.id));
      sendSuccess({ res, data: { menuItem: item } });
    } catch (error) {
      next(error);
    }
  }

  async createMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const messId = req.query.messId as string | undefined;
      const item = await menuItemService.createItem(messId, req.body);
      sendSuccess({ res, data: { menuItem: item }, statusCode: 201 });
    } catch (error) {
      next(error);
    }
  }

  async updateMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await menuItemService.updateItem(String(req.params.id), req.body);
      sendSuccess({ res, data: { menuItem: item } });
    } catch (error) {
      next(error);
    }
  }

  async updateMenuItemStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await menuItemService.setItemStatus(String(req.params.id), req.body.isAvailable);
      sendSuccess({ res, data: { menuItem: item } });
    } catch (error) {
      next(error);
    }
  }

  async deleteMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await menuItemService.deleteItem(String(req.params.id));
      sendSuccess({ res, data: { message: 'Menu item deleted successfully' } });
    } catch (error) {
      next(error);
    }
  }
}

export const menuItemController = new MenuItemController();
