import prisma from '../lib/prisma';
import { MenuItem, Prisma } from '@prisma/client';

export class MenuItemRepository {
  async findByMessId(
    messId: string,
    filter?: { isAvailable?: boolean; category?: string; search?: string },
  ): Promise<MenuItem[]> {
    const where: Prisma.MenuItemWhereInput = { messId };

    if (filter?.isAvailable !== undefined) {
      where.isAvailable = filter.isAvailable;
    }

    if (filter?.category) {
      where.category = filter.category;
    }

    if (filter?.search) {
      where.name = {
        contains: filter.search,
        mode: 'insensitive',
      };
    }

    return prisma.menuItem.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<MenuItem | null> {
    return prisma.menuItem.findUnique({
      where: { id },
    });
  }

  async findByNameAndMess(messId: string, name: string): Promise<MenuItem | null> {
    return prisma.menuItem.findUnique({
      where: {
        messId_name: { messId, name },
      },
    });
  }

  async create(data: {
    messId: string;
    name: string;
    category?: string | null;
    defaultServingGrams?: number | null;
    isAvailable?: boolean;
  }): Promise<MenuItem> {
    return prisma.menuItem.create({
      data: {
        messId: data.messId,
        name: data.name,
        category: data.category,
        defaultServingGrams: data.defaultServingGrams,
        isAvailable: data.isAvailable ?? true,
      },
    });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      category: string | null;
      defaultServingGrams: number | null;
      isAvailable: boolean;
    }>,
  ): Promise<MenuItem> {
    return prisma.menuItem.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<MenuItem> {
    return prisma.menuItem.delete({
      where: { id },
    });
  }

  async countMenuDishes(menuItemId: string): Promise<number> {
    return prisma.menuDish.count({
      where: { menuItemId },
    });
  }
}

export const menuItemRepository = new MenuItemRepository();
