const { menuService } = require('../services/menu.service');
const { sendSuccess } = require('../utils/apiResponse');

class MenuController {
  async listMenus(req, res, next) {
    try {
      const messId = req.query.messId;
      const date = req.query.date;
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;
      const mealType = req.query.mealType;

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

  async getMenuById(req, res, next) {
    try {
      const menu = await menuService.getMenuById(String(req.params.id));
      sendSuccess({ res, data: { menu } });
    } catch (error) {
      next(error);
    }
  }

  async createMenu(req, res, next) {
    try {
      const messId = req.query.messId;
      const menu = await menuService.createMenu(messId, req.body);
      sendSuccess({ res, data: { menu }, statusCode: 201 });
    } catch (error) {
      next(error);
    }
  }

  async deleteMenu(req, res, next) {
    try {
      await menuService.deleteMenu(String(req.params.id));
      sendSuccess({ res, data: { message: 'Menu deleted successfully' } });
    } catch (error) {
      next(error);
    }
  }

  async addDish(req, res, next) {
    try {
      const dish = await menuService.addDishToMenu(String(req.params.id), req.body);
      sendSuccess({ res, data: { dish }, statusCode: 201 });
    } catch (error) {
      next(error);
    }
  }

  async removeDish(req, res, next) {
    try {
      const dishId = String(req.params.dishId || req.params.itemId);
      const dish = await menuService.removeDishFromMenu(String(req.params.id), dishId);
      sendSuccess({ res, data: { dish, message: 'Dish removed successfully' } });
    } catch (error) {
      next(error);
    }
  }
}

const menuController = new MenuController();

module.exports = {
  MenuController,
  menuController,
};
