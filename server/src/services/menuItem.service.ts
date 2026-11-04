import { menuItemRepository } from '../repositories/menuItem.repository';
import { messService } from './mess.service';
import { NotFoundError, ConflictError, BadRequestError } from '../errors';
import { CreateMenuItemInput, UpdateMenuItemInput } from '../validators/menuItem.validators';
import { MenuItem } from '@prisma/client';

export class MenuItemService {
  async listItems(
    messId?: string,
    filter?: { isAvailable?: boolean; category?: string; search?: string },
  ): Promise<MenuItem[]> {
    const mess = await messService.getMess(messId);
    return menuItemRepository.findByMessId(mess.id, filter);
  }

  async getItemById(id: string): Promise<MenuItem> {
    const item = await menuItemRepository.findById(id);
    if (!item) {
      throw new NotFoundError('MENU_ITEM_NOT_FOUND', 'Menu item not found');
    }
    return item;
  }

  async createItem(messId: string | undefined, data: CreateMenuItemInput): Promise<MenuItem> {
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

  async updateItem(id: string, data: UpdateMenuItemInput): Promise<MenuItem> {
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

  async setItemStatus(id: string, isAvailable: boolean): Promise<MenuItem> {
    await this.getItemById(id);
    return menuItemRepository.update(id, { isAvailable });
  }

  async deleteItem(id: string): Promise<MenuItem> {
    await this.getItemById(id);

    const usageCount = await menuItemRepository.countMenuDishes(id);
    if (usageCount > 0) {
      throw new BadRequestError(
        'CANNOT_DELETE_ITEM',
        'Cannot delete menu item that is referenced in menus. Deactivate it instead.',
      );
    }

    return menuItemRepository.delete(id);
  }
}

export const menuItemService = new MenuItemService();
