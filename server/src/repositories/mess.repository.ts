import prisma from '../lib/prisma';
import { Mess } from '@prisma/client';

export class MessRepository {
  async findFirst(): Promise<Mess | null> {
    return prisma.mess.findFirst({
      where: { isActive: true },
    });
  }

  async findById(id: string): Promise<Mess | null> {
    return prisma.mess.findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<Mess[]> {
    return prisma.mess.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(data: {
    name: string;
    location?: string | null;
    totalCapacity: number;
    isActive?: boolean;
  }): Promise<Mess> {
    return prisma.mess.create({
      data: {
        name: data.name,
        location: data.location,
        totalCapacity: data.totalCapacity,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      location: string | null;
      totalCapacity: number;
      isActive: boolean;
    }>,
  ): Promise<Mess> {
    return prisma.mess.update({
      where: { id },
      data,
    });
  }
}

export const messRepository = new MessRepository();
