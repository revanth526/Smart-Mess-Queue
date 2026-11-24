const prisma = require('../lib/prisma');

const refreshTokenRepository = {
  async create(data) {
    return prisma.refreshToken.create({ data });
  },

  async findByToken(token) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  },

  async revokeByToken(token) {
    return prisma.refreshToken.update({
      where: { token },
      data: { isRevoked: true },
    });
  },

  async revokeAllForUser(userId) {
    return prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  },

  async deleteExpired() {
    return prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  },
};

module.exports = {
  refreshTokenRepository,
};
