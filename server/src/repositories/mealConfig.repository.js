const prisma = require('../lib/prisma');

class MealConfigRepository {
  async findByMessId(messId) {
    return prisma.mealConfig.findMany({
      where: { messId },
      orderBy: { mealType: 'asc' },
    });
  }

  async findById(id) {
    return prisma.mealConfig.findUnique({
      where: { id },
    });
  }

  async findByMessAndMealType(messId, mealType) {
    return prisma.mealConfig.findUnique({
      where: {
        messId_mealType: { messId, mealType },
      },
    });
  }

  async create(data) {
    return prisma.mealConfig.create({
      data,
    });
  }

  async update(id, data) {
    return prisma.mealConfig.update({
      where: { id },
      data,
    });
  }
}

const mealConfigRepository = new MealConfigRepository();

module.exports = {
  MealConfigRepository,
  mealConfigRepository,
};
