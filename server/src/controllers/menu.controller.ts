import { Request, Response, NextFunction } from 'express';
import { menuService } from '../services/menu.service';
import { sendSuccess } from '../utils/apiResponse';
import { MealType } from '@prisma/client';

export class MenuController {
  async listMenus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const messId = req.query.messId as string | undefined;
      const date = req.query.date as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const mealType = req.query.mealType as MealType | undefined;

      const menus = await menuService.listMenus({
        messId,
        date,
        startDate,
        endDate,
        mealType,
      });

      sendSuccess({ res, data: { menus } });
    } catch (error) {
      next(error);
    }
  }

  async getMenuById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const menu = await menuService.getMenuById(String(req.params.id));
      sendSuccess({ res, data: { menu } });
    } catch (error) {
      next(error);
    }
  }

  async createMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const messId = req.query.messId as string | undefined;
      const menu = await menuService.createMenu(messId, req.body);
      sendSuccess({ res, data: { menu }, statusCode: 201 });
    } catch (error) {
      next(error);
    }
  }

  async deleteMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await menuService.deleteMenu(String(req.params.id));
      sendSuccess({ res, data: { message: 'Menu deleted successfully' } });
    } catch (error) {
      next(error);
    }
  }

  async addDish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dish = await menuService.addDishToMenu(String(req.params.id), req.body);
      sendSuccess({ res, data: { dish }, statusCode: 201 });
    } catch (error) {
      next(error);
    }
  }

  async removeDish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dishId = String(req.params.dishId || req.params.itemId);
      const dish = await menuService.removeDishFromMenu(String(req.params.id), dishId);
      sendSuccess({ res, data: { dish, message: 'Dish removed successfully' } });
    } catch (error) {
      next(error);
    }
  }
}

export const menuController = new MenuController();
