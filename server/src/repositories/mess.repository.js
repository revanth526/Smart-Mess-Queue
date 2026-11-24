const prisma = require('../lib/prisma');

class MessRepository {
  async findFirst() {
    return prisma.mess.findFirst({
      where: { isActive: true },
    });
  }

  async findById(id) {
    return prisma.mess.findUnique({
      where: { id },
    });
  }

  async findAll() {
    return prisma.mess.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(data) {
    return prisma.mess.create({
      data: {
        name: data.name,
        location: data.location,
        totalCapacity: data.totalCapacity,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id, data) {
    return prisma.mess.update({
      where: { id },
      data,
    });
  }
}

const messRepository = new MessRepository();

module.exports = {
  MessRepository,
  messRepository,
};
