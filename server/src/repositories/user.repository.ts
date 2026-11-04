import { Prisma, Role, User } from '@prisma/client';
import prisma from '../lib/prisma';

// Fields to select when returning public user data (never include passwordHash)
export const USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  email: true,
  studentId: true,
  rollNo: true,
  role: true,
  isActive: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type UserPublicRecord = Prisma.UserGetPayload<{ select: typeof USER_PUBLIC_SELECT }>;

export const userRepository = {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  async findByStudentId(studentId: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        OR: [{ studentId }, { rollNo: studentId }],
      },
    });
  },

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  async findByIdPublic(id: string): Promise<UserPublicRecord | null> {
    return prisma.user.findUnique({
      where: { id },
      select: USER_PUBLIC_SELECT,
    });
  },

  async create(data: {
    name: string;
    email?: string | null;
    studentId?: string | null;
    passwordHash: string;
    role?: Role;
    rollNo?: string | null;
  }): Promise<UserPublicRecord> {
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

  async existsByEmail(email: string): Promise<boolean> {
    const count = await prisma.user.count({ where: { email } });
    return count > 0;
  },

  async existsByStudentId(studentId: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: {
        OR: [{ studentId }, { rollNo: studentId }],
      },
    });
    return count > 0;
  },

  async existsByRollNo(rollNo: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: {
        OR: [{ rollNo }, { studentId: rollNo }],
      },
    });
    return count > 0;
  },
};
