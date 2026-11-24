const { menuItemService } = require('../services/menuItem.service');
const { sendSuccess } = require('../utils/apiResponse');

class MenuItemController {
  async listMenuItems(req, res, next) {
    try {
      const messId = req.query.messId;
      const isAvailable =
        req.query.isAvailable !== undefined ? req.query.isAvailable === 'true' : undefined;
      const category = req.query.category;
      const search = req.query.search;

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

  async getMenuItemById(req, res, next) {
    try {
      const item = await menuItemService.getItemById(String(req.params.id));
      sendSuccess({ res, data: { menuItem: item } });
    } catch (error) {
      next(error);
    }
  }

  async createMenuItem(req, res, next) {
    try {
      const messId = req.query.messId;
      const item = await menuItemService.createItem(messId, req.body);
      sendSuccess({ res, data: { menuItem: item }, statusCode: 201 });
    } catch (error) {
      next(error);
    }
  }

  async updateMenuItem(req, res, next) {
    try {
      const item = await menuItemService.updateItem(String(req.params.id), req.body);
      sendSuccess({ res, data: { menuItem: item } });
    } catch (error) {
      next(error);
    }
  }

  async updateMenuItemStatus(req, res, next) {
    try {
      const item = await menuItemService.setItemStatus(String(req.params.id), req.body.isAvailable);
      sendSuccess({ res, data: { menuItem: item } });
    } catch (error) {
      next(error);
    }
  }

  async deleteMenuItem(req, res, next) {
    try {
      await menuItemService.deleteItem(String(req.params.id));
      sendSuccess({ res, data: { message: 'Menu item deleted successfully' } });
    } catch (error) {
      next(error);
    }
  }
}

const menuItemController = new MenuItemController();

module.exports = {
  MenuItemController,
  menuItemController,
};
