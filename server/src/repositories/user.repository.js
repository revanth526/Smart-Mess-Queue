const prisma = require('../lib/prisma');

// Fields to select when returning public user data (never include passwordHash)
const USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  email: true,
  studentId: true,
  rollNo: true,
  role: true,
  isActive: true,
  createdAt: true,
};

const userRepository = {
  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },

  async findByStudentId(studentId) {
    return prisma.user.findFirst({
      where: {
        OR: [{ studentId }, { rollNo: studentId }],
      },
    });
  },

  async findById(id) {
    return prisma.user.findUnique({ where: { id } });
  },

  async findByIdPublic(id) {
    return prisma.user.findUnique({
      where: { id },
      select: USER_PUBLIC_SELECT,
    });
  },

  async create(data) {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email ?? null,
        studentId: data.studentId ?? data.rollNo ?? null,
        passwordHash: data.passwordHash,
        role: data.role ?? 'STUDENT',
        rollNo: data.rollNo ?? data.studentId ?? null,
      },
      select: USER_PUBLIC_SELECT,
    });
  },

  async existsByEmail(email) {
    const count = await prisma.user.count({ where: { email } });
    return count > 0;
  },

  async existsByStudentId(studentId) {
    const count = await prisma.user.count({
      where: {
        OR: [{ studentId }, { rollNo: studentId }],
      },
    });
    return count > 0;
  },

  async existsByRollNo(rollNo) {
    const count = await prisma.user.count({
      where: {
        OR: [{ rollNo }, { studentId: rollNo }],
      },
    });
    return count > 0;
  },
};

module.exports = {
  USER_PUBLIC_SELECT,
  userRepository,
};
