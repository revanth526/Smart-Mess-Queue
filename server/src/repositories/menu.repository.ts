import prisma from '../lib/prisma';
import { Menu, MenuDish, MealType, Prisma } from '@prisma/client';

export type MenuWithDetails = Menu & {
  dishes: MenuDish[];
  slots: {
    id: string;
    menuId: string;
    startTime: Date;
    endTime: Date;
    capacity: number;
    currentBookings: number;
    createdAt: Date;
  }[];
};

export class MenuRepository {
  async findById(id: string): Promise<MenuWithDetails | null> {
    return prisma.menu.findUnique({
      where: { id },
      include: {
        dishes: {
          orderBy: { sortOrder: 'asc' },
        },
        slots: {
          orderBy: { startTime: 'asc' },
        },
      },
    });
  }

  async findByMessDateMealType(
    messId: string,
    date: Date,
    mealType: MealType,
  ): Promise<MenuWithDetails | null> {
    return prisma.menu.findUnique({
      where: {
        messId_date_mealType: {
          messId,
          date,
          mealType,
        },
      },
      include: {
        dishes: {
          orderBy: { sortOrder: 'asc' },
        },
        slots: {
          orderBy: { startTime: 'asc' },
        },
      },
    });
  }

  async findAll(filter: {
    messId?: string;
    date?: Date;
    startDate?: Date;
    endDate?: Date;
    mealType?: MealType;
  }): Promise<MenuWithDetails[]> {
    const where: Prisma.MenuWhereInput = {};

    if (filter.messId) {
      where.messId = filter.messId;
    }

    if (filter.date) {
      where.date = filter.date;
    } else if (filter.startDate || filter.endDate) {
      where.date = {};
      if (filter.startDate) where.date.gte = filter.startDate;
      if (filter.endDate) where.date.lte = filter.endDate;
    }

    if (filter.mealType) {
      where.mealType = filter.mealType;
    }

    return prisma.menu.findMany({
      where,
      include: {
        dishes: {
          orderBy: { sortOrder: 'asc' },
        },
        slots: {
          orderBy: { startTime: 'asc' },
        },
      },
      orderBy: [{ date: 'asc' }, { mealType: 'asc' }],
    });
  }

  async create(data: {
    messId: string;
    date: Date;
    mealType: MealType;
    dishes?: Array<{
      menuItemId?: string | null;
      dishName: string;
      dishCategory?: string | null;
      servingGrams?: number | null;
      sortOrder?: number;
    }>;
  }): Promise<MenuWithDetails> {
    return prisma.menu.create({
      data: {
        messId: data.messId,
        date: data.date,
        mealType: data.mealType,
        dishes: data.dishes
          ? {
              create: data.dishes.map((dish, index) => ({
                menuItemId: dish.menuItemId || null,
                dishName: dish.dishName,
                dishCategory: dish.dishCategory || null,
                servingGrams: dish.servingGrams || null,
                sortOrder: dish.sortOrder ?? index,
              })),
            }
          : undefined,
      },
      include: {
        dishes: {
          orderBy: { sortOrder: 'asc' },
        },
        slots: {
          orderBy: { startTime: 'asc' },
        },
      },
    });
  }

  async delete(id: string): Promise<Menu> {
    return prisma.menu.delete({
      where: { id },
    });
  }

  async addDish(
    menuId: string,
    dish: {
      menuItemId?: string | null;
      dishName: string;
      dishCategory?: string | null;
      servingGrams?: number | null;
      sortOrder?: number;
    },
  ): Promise<MenuDish> {
    return prisma.menuDish.create({
      data: {
        menuId,
        menuItemId: dish.menuItemId || null,
        dishName: dish.dishName,
        dishCategory: dish.dishCategory || null,
        servingGrams: dish.servingGrams || null,
        sortOrder: dish.sortOrder ?? 0,
      },
    });
  }

  async removeDish(dishId: string): Promise<MenuDish> {
    return prisma.menuDish.delete({
      where: { id: dishId },
    });
  }

  async findDishById(dishId: string): Promise<MenuDish | null> {
    return prisma.menuDish.findUnique({
      where: { id: dishId },
    });
  }

  async countBookings(menuId: string): Promise<number> {
    return prisma.booking.count({
      where: { menuId },
    });
  }
}

export const menuRepository = new MenuRepository();
