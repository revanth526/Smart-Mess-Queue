const { menuRepository } = require('../repositories/menu.repository');
const { menuItemRepository } = require('../repositories/menuItem.repository');
const { messService } = require('./mess.service');
const { timeSlotService } = require('./timeSlot.service');
const { NotFoundError, ConflictError, BadRequestError, AppError } = require('../errors');
const prisma = require('../lib/prisma');

class MenuService {
  async getMenuById(id) {
    const menu = await menuRepository.findById(id);
    if (!menu) {
      throw new NotFoundError('MENU_NOT_FOUND', 'Menu not found');
    }
    return menu;
  }

  async listMenus(filter) {
    const mess = await messService.getMess(filter.messId);

    const queryFilter = {
      messId: mess.id,
      mealType: filter.mealType,
    };

    if (filter.date) {
      queryFilter.date = new Date(`${filter.date}T00:00:00.000Z`);
    } else {
      if (filter.startDate) {
        queryFilter.startDate = new Date(`${filter.startDate}T00:00:00.000Z`);
      }
      if (filter.endDate) {
        queryFilter.endDate = new Date(`${filter.endDate}T23:59:59.999Z`);
      }
    }

    return menuRepository.findAll(queryFilter);
  }

  async createMenu(messId, data) {
    const mess = await messService.getMess(messId || data.messId);
    const date = new Date(`${data.date}T00:00:00.000Z`);

    // 1. Check uniqueness constraint [messId, date, mealType]
    const existing = await menuRepository.findByMessDateMealType(mess.id, date, data.mealType);
    if (existing) {
      throw new ConflictError(
        'DUPLICATE_MENU',
        `A menu already exists for ${data.mealType} on ${data.date}`,
      );
    }

    // 2. Prepare dishes with snapshots from MenuItem master catalog
    const preparedDishes = [];

    if (data.dishes && data.dishes.length > 0) {
      for (let i = 0; i < data.dishes.length; i++) {
        const dish = data.dishes[i];
        let name = dish.dishName;
        let category = dish.dishCategory;
        let grams = dish.servingGrams;

        if (dish.menuItemId) {
          const masterItem = await menuItemRepository.findById(dish.menuItemId);
          if (masterItem) {
            name = name || masterItem.name;
            category = category || masterItem.category;
            grams = grams ?? masterItem.defaultServingGrams;
          }
        }

        preparedDishes.push({
          menuItemId: dish.menuItemId || null,
          dishName: name,
          dishCategory: category || null,
          servingGrams: grams || null,
          sortOrder: dish.sortOrder ?? i,
        });
      }
    }

    // 3. Create Menu record
    const createdMenu = await menuRepository.create({
      messId: mess.id,
      date,
      mealType: data.mealType,
      dishes: preparedDishes,
    });

    // 4. Auto-generate TimeSlots according to MealConfig
    try {
      await timeSlotService.generateSlotsForMenu(createdMenu.id);
    } catch {
      // If no mealConfig is configured or invalid, log and continue with empty slots
    }

    // 5. Return complete menu with dishes and slots
    return this.getMenuById(createdMenu.id);
  }

  async addDishToMenu(menuId, data) {
    const menu = await this.getMenuById(menuId);

    // Historical protection check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const menuDate = new Date(menu.date);
    if (menuDate < today) {
      throw new BadRequestError('CANNOT_MODIFY_HISTORICAL_MENU', 'Cannot modify historical menu');
    }

    let name = data.dishName;
    let category = data.dishCategory;
    let grams = data.servingGrams;

    if (data.menuItemId) {
      const masterItem = await menuItemRepository.findById(data.menuItemId);
      if (masterItem) {
        name = name || masterItem.name;
        category = category || masterItem.category;
        grams = grams ?? masterItem.defaultServingGrams;
      }
    }

    return menuRepository.addDish(menuId, {
      menuItemId: data.menuItemId || null,
      dishName: name,
      dishCategory: category || null,
      servingGrams: grams || null,
      sortOrder: data.sortOrder ?? menu.dishes.length,
    });
  }

  async removeDishFromMenu(menuId, dishId) {
    const menu = await this.getMenuById(menuId);

    // Historical protection check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const menuDate = new Date(menu.date);
    if (menuDate < today) {
      throw new BadRequestError('CANNOT_MODIFY_HISTORICAL_MENU', 'Cannot modify historical menu');
    }

    const dish = await menuRepository.findDishById(dishId);
    if (!dish || dish.menuId !== menuId) {
      throw new NotFoundError('DISH_NOT_FOUND', 'Dish not found on this menu');
    }

    // Check if menu has food logs
    const foodLogsCount = await prisma.foodLog.count({
      where: { menuId },
    });
    if (foodLogsCount > 0) {
      throw new BadRequestError(
        'CANNOT_MODIFY_HISTORICAL_MENU',
        'Cannot remove dish from a menu that has recorded food logs',
      );
    }

    return menuRepository.removeDish(dishId);
  }

  async deleteMenu(menuId) {
    await this.getMenuById(menuId);

    const bookingCount = await menuRepository.countBookings(menuId);
    if (bookingCount > 0) {
      throw new BadRequestError(
        'MENU_HAS_BOOKINGS',
        'Cannot delete menu because active bookings exist for this meal',
      );
    }

    try {
      return await menuRepository.delete(menuId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error && error.code === 'P2003') {
        throw new BadRequestError(
          'MENU_HAS_DEPENDENCIES',
          'Cannot delete menu because related active records still reference it',
        );
      }
      if (error && error.code === 'P2025') {
        throw new NotFoundError('MENU_NOT_FOUND', 'Menu not found');
      }
      throw error;
    }
  }
}

const menuService = new MenuService();

module.exports = {
  MenuService,
  menuService,
};
