import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { env } from '../config/env';
import { signAccessToken, generateRefreshToken, parseDurationToMs } from '../config/jwt';
import { userRepository } from '../repositories/user.repository';
import { refreshTokenRepository } from '../repositories/refreshToken.repository';
import { ConflictError, UnauthorizedError, ForbiddenError } from '../errors';

interface RegisterParams {
  name: string;
  studentId?: string;
  email?: string;
  password: string;
  rollNo?: string;
  role?: Role;
}

interface LoginParams {
  studentId?: string;
  email?: string;
  password: string;
}

interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string | null;
    studentId?: string | null;
    rollNo: string | null;
    role: Role;
    isActive: boolean;
    createdAt: Date;
  };
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async register(params: RegisterParams): Promise<AuthResult> {
    const studentIdentifier = params.studentId || params.rollNo;

    // Check duplicate studentId / rollNo
    if (studentIdentifier) {
      const existingStudent = await userRepository.existsByStudentId(studentIdentifier);
      if (existingStudent) {
        throw new ConflictError(
          'DUPLICATE_STUDENT_ID',
          'An account with this Student ID already exists',
        );
      }
    }

    // Check duplicate email if provided
    if (params.email) {
      const existingUser = await userRepository.findByEmail(params.email);
      if (existingUser) {
        throw new ConflictError('DUPLICATE_EMAIL', 'An account with this email already exists');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(params.password, env.BCRYPT_ROUNDS);

    // Public registration MUST ALWAYS assign Role.STUDENT — never allow MESS_ADMIN
    const assignedRole = Role.STUDENT;

    // Create user
    const user = await userRepository.create({
      name: params.name,
      email: params.email ?? null,
      studentId: studentIdentifier ?? null,
      passwordHash,
      role: assignedRole,
      rollNo: studentIdentifier ?? null,
    });

    // Generate tokens
    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken();

    // Store refresh token
    const expiresAt = new Date(Date.now() + parseDurationToMs(env.REFRESH_TOKEN_EXPIRY));
    await refreshTokenRepository.create({
      userId: user.id,
      token: refreshToken,
      expiresAt,
    });

    return { user, accessToken, refreshToken };
  },

  async login(params: LoginParams): Promise<AuthResult> {
    let user = null;

    if (params.studentId) {
      // ── Student Login via Student ID ───────────────────────
      user = await userRepository.findByStudentId(params.studentId);
      if (!user) {
        await bcrypt.hash(params.password, env.BCRYPT_ROUNDS);
        throw new UnauthorizedError('Invalid student ID or password');
      }

      // Enforce student role
      if (user.role !== Role.STUDENT) {
        await bcrypt.hash(params.password, env.BCRYPT_ROUNDS);
        throw new UnauthorizedError('Invalid student ID or password');
      }
    } else if (params.email) {
      // ── Admin Login via Email ──────────────────────────────
      user = await userRepository.findByEmail(params.email);
      if (!user) {
        await bcrypt.hash(params.password, env.BCRYPT_ROUNDS);
        throw new UnauthorizedError('Invalid email or password');
      }

      // Enforce admin role: non-admins cannot log in via admin email portal
      if (user.role !== Role.MESS_ADMIN) {
        await bcrypt.hash(params.password, env.BCRYPT_ROUNDS);
        throw new UnauthorizedError('Invalid email or password');
      }
    } else {
      throw new UnauthorizedError('Student ID or Email is required');
    }

    // Check active status
    if (!user.isActive) {
      throw new ForbiddenError('Account is deactivated. Please contact an administrator.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(params.password, user.passwordHash);
    if (!isPasswordValid) {
      const errMessage = params.studentId
        ? 'Invalid student ID or password'
        : 'Invalid email or password';
      throw new UnauthorizedError(errMessage);
    }

    // Generate tokens
    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken();

    // Store refresh token
    const expiresAt = new Date(Date.now() + parseDurationToMs(env.REFRESH_TOKEN_EXPIRY));
    await refreshTokenRepository.create({
      userId: user.id,
      token: refreshToken,
      expiresAt,
    });

    // Return public user data (no passwordHash)
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        rollNo: user.rollNo,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  },

  async refresh(currentRefreshToken: string): Promise<AuthResult> {
    const storedToken = await refreshTokenRepository.findByToken(currentRefreshToken);

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (storedToken.isRevoked) {
      await refreshTokenRepository.revokeAllForUser(storedToken.userId);
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token has expired');
    }

    const user = storedToken.user;

    if (!user.isActive) {
      throw new ForbiddenError('Account is deactivated');
    }

    // Rotate: revoke old token
    await refreshTokenRepository.revokeByToken(currentRefreshToken);

    // Issue new tokens
    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken();

    const expiresAt = new Date(Date.now() + parseDurationToMs(env.REFRESH_TOKEN_EXPIRY));
    await refreshTokenRepository.create({
      userId: user.id,
      token: newRefreshToken,
      expiresAt,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        rollNo: user.rollNo,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken: newRefreshToken,
    };
  },

  async logout(refreshToken: string): Promise<void> {
    const storedToken = await refreshTokenRepository.findByToken(refreshToken);

    if (storedToken && !storedToken.isRevoked) {
      await refreshTokenRepository.revokeByToken(refreshToken);
    }
  },

  async getProfile(userId: string) {
    const user = await userRepository.findByIdPublic(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    return user;
  },
};
