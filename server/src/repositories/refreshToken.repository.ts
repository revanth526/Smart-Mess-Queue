import prisma from '../lib/prisma';

export const refreshTokenRepository = {
  async create(data: { userId: string; token: string; expiresAt: Date }) {
    return prisma.refreshToken.create({ data });
  },

  async findByToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  },

  async revokeByToken(token: string) {
    return prisma.refreshToken.update({
      where: { token },
      data: { isRevoked: true },
    });
  },

  async revokeAllForUser(userId: string) {
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
