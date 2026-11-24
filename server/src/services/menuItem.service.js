const { menuItemRepository } = require('../repositories/menuItem.repository');
const { messService } = require('./mess.service');
const { NotFoundError, ConflictError, BadRequestError } = require('../errors');

class MenuItemService {
  async listItems(messId, filter) {
    const mess = await messService.getMess(messId);
    return menuItemRepository.findByMessId(mess.id, filter);
  }

  async getItemById(id) {
    const item = await menuItemRepository.findById(id);
    if (!item) {
      throw new NotFoundError('MENU_ITEM_NOT_FOUND', 'Menu item not found');
    }
    return item;
  }

  async createItem(messId, data) {
    const mess = await messService.getMess(messId || data.messId);

    const existing = await menuItemRepository.findByNameAndMess(mess.id, data.name);
    if (existing) {
      throw new ConflictError(
        'DUPLICATE_MENU_ITEM',
        `A menu item with the name "${data.name}" already exists`,
      );
    }

    return menuItemRepository.create({
      messId: mess.id,
      name: data.name,
      category: data.category,
      defaultServingGrams: data.defaultServingGrams,
      isAvailable: data.isAvailable ?? true,
    });
  }

  async updateItem(id, data) {
    const item = await this.getItemById(id);

    if (data.name && data.name !== item.name) {
      const duplicate = await menuItemRepository.findByNameAndMess(item.messId, data.name);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError(
          'DUPLICATE_MENU_ITEM',
          `A menu item with the name "${data.name}" already exists`,
        );
      }
    }

    return menuItemRepository.update(id, data);
  }

  async setItemStatus(id, isAvailable) {
    await this.getItemById(id);
    return menuItemRepository.update(id, { isAvailable });
  }

  async deleteItem(id) {
    await this.getItemById(id);

    // 1. Check if referenced by daily menus
    const usageCount = await menuItemRepository.countMenuDishes(id);
    if (usageCount > 0) {
      throw new BadRequestError(
        'CANNOT_DELETE_ITEM',
        'Cannot delete menu item that is referenced in menus. Deactivate it instead.',
      );
    }

    // 2. Safe deletion: detach any orphan dish references and delete
    try {
      await menuItemRepository.detachMenuDishes(id);
      return await menuItemRepository.delete(id);
    } catch (err) {
      if (err.code === 'P2003' || err.code === 'P2014') {
        throw new BadRequestError(
          'CANNOT_DELETE_ITEM',
          'Cannot delete menu item due to existing dependencies. Deactivate it instead.',
        );
      }
      throw err;
    }
  }
}

const menuItemService = new MenuItemService();

module.exports = {
  MenuItemService,
  menuItemService,
};
