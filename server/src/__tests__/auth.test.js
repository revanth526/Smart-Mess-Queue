const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { userRepository } = require('../repositories/user.repository');
const { refreshTokenRepository } = require('../repositories/refreshToken.repository');
const { env } = require('../config/env');

// Mock repositories
jest.mock('../repositories/user.repository');
jest.mock('../repositories/refreshToken.repository');

const mockedUserRepo = userRepository;
const mockedRefreshTokenRepo = refreshTokenRepository;

// Test data
const TEST_PASSWORD = 'StrongPass1';
const TEST_STUDENT_ID = '12410001';
const TEST_ADMIN_EMAIL = 'rkrevanth07@gmail.com';

const mockStudentPublic = {
  id: 'user-uuid-1',
  name: 'Test Student',
  email: null,
  studentId: TEST_STUDENT_ID,
  rollNo: TEST_STUDENT_ID,
  role: 'STUDENT',
  isActive: true,
  createdAt: new Date('2024-01-01'),
};

const mockStudentFull = {
  ...mockStudentPublic,
  passwordHash: bcrypt.hashSync(TEST_PASSWORD, 4), // Low rounds for speed
  updatedAt: new Date('2024-01-01'),
};

const mockAdminPublic = {
  id: 'admin-uuid-1',
  name: 'Admin User',
  email: TEST_ADMIN_EMAIL,
  studentId: null,
  rollNo: null,
  role: 'MESS_ADMIN',
  isActive: true,
  createdAt: new Date('2024-01-01'),
};

const mockAdminFull = {
  ...mockAdminPublic,
  passwordHash: bcrypt.hashSync(TEST_PASSWORD, 4),
  updatedAt: new Date('2024-01-01'),
};

const mockInactiveStudent = {
  ...mockStudentFull,
  id: 'inactive-uuid',
  isActive: false,
};

function createMockRefreshTokenRecord(overrides = {}) {
  return {
    id: 'rt-uuid-1',
    userId: mockStudentPublic.id,
    token: 'valid-refresh-token',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isRevoked: false,
    createdAt: new Date(),
    user: mockStudentFull,
    ...overrides,
  };
}

function getValidAccessToken(userId = mockStudentPublic.id, role = 'STUDENT') {
  return jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, { expiresIn: '15m', subject: userId });
}

function getExpiredAccessToken(userId = mockStudentPublic.id, role = 'STUDENT') {
  return jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, { expiresIn: '0s', subject: userId });
}

describe('Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════
  // STUDENT REGISTRATION
  // ═══════════════════════════════════════════════════════════════
  describe('POST /api/auth/register', () => {
    const validStudentPayload = {
      name: 'Test Student',
      studentId: TEST_STUDENT_ID,
      password: TEST_PASSWORD,
    };

    it('1. should register a new student with numeric Student ID successfully', async () => {
      mockedUserRepo.existsByStudentId.mockResolvedValue(false);
      mockedUserRepo.create.mockResolvedValue(mockStudentPublic);
      mockedRefreshTokenRepo.create.mockResolvedValue({});

      const res = await request(app).post('/api/auth/register').send(validStudentPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.studentId).toBe(TEST_STUDENT_ID);
      expect(res.body.data.user.role).toBe('STUDENT');
      expect(res.body.data.accessToken).toBeDefined();
      // Refresh token should be in cookie, not in body
      expect(res.body.data.refreshToken).toBeUndefined();
      // Should never return passwordHash
      expect(res.body.data.user.passwordHash).toBeUndefined();

      // Verify cookie is set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : cookies;
      expect(cookieStr).toContain('refresh_token');
      expect(cookieStr).toContain('HttpOnly');
      expect(cookieStr).toContain('Path=/api/auth');
    });

    it('2. should reject duplicate student ID registration', async () => {
      mockedUserRepo.existsByStudentId.mockResolvedValue(true);

      const res = await request(app).post('/api/auth/register').send(validStudentPayload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_STUDENT_ID');
    });

    it('3. should reject non-numeric Student ID', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validStudentPayload, studentId: 'ABC12410' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('4. should reject registration with short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validStudentPayload, password: 'Ab1' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('5. should hash the password (never store plaintext)', async () => {
      mockedUserRepo.existsByStudentId.mockResolvedValue(false);
      mockedUserRepo.create.mockResolvedValue(mockStudentPublic);
      mockedRefreshTokenRepo.create.mockResolvedValue({});

      await request(app).post('/api/auth/register').send(validStudentPayload);

      const createCall = mockedUserRepo.create.mock.calls[0][0];
      expect(createCall.passwordHash).not.toBe(TEST_PASSWORD);
      expect(createCall.passwordHash.startsWith('$2')).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // STUDENT & ADMIN LOGIN
  // ═══════════════════════════════════════════════════════════════
  describe('POST /api/auth/login', () => {
    const validStudentLogin = { studentId: TEST_STUDENT_ID, password: TEST_PASSWORD };
    const validAdminLogin = { email: TEST_ADMIN_EMAIL, password: TEST_PASSWORD };

    it('6. should login student successfully with numeric Student ID', async () => {
      mockedUserRepo.findByStudentId.mockResolvedValue(mockStudentFull);
      mockedRefreshTokenRepo.create.mockResolvedValue({});

      const res = await request(app).post('/api/auth/login').send(validStudentLogin);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.studentId).toBe(TEST_STUDENT_ID);
      expect(res.body.data.user.role).toBe('STUDENT');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('7. should login admin successfully with Email', async () => {
      mockedUserRepo.findByEmail.mockResolvedValue(mockAdminFull);
      mockedRefreshTokenRepo.create.mockResolvedValue({});

      const res = await request(app).post('/api/auth/login').send(validAdminLogin);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(TEST_ADMIN_EMAIL);
      expect(res.body.data.user.role).toBe('MESS_ADMIN');
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('8. should reject student login with incorrect password', async () => {
      mockedUserRepo.findByStudentId.mockResolvedValue(mockStudentFull);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ ...validStudentLogin, password: 'WrongPassword1' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid student ID or password');
    });

    it('9. should reject student login for nonexistent account', async () => {
      mockedUserRepo.findByStudentId.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ studentId: '99999999', password: TEST_PASSWORD });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid student ID or password');
    });

    it('10. should reject admin login when student account email is supplied', async () => {
      // User with STUDENT role tries to login via admin email
      mockedUserRepo.findByEmail.mockResolvedValue(mockStudentFull);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'student@example.com', password: TEST_PASSWORD });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('11. should reject login for inactive student account', async () => {
      mockedUserRepo.findByStudentId.mockResolvedValue(mockInactiveStudent);

      const res = await request(app).post('/api/auth/login').send(validStudentLogin);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // ACCESS TOKEN VALIDATION (via GET /api/auth/me)
  // ═══════════════════════════════════════════════════════════════
  describe('GET /api/auth/me (access token validation)', () => {
    it('12. should return user profile with valid access token', async () => {
      const token = getValidAccessToken();
      mockedUserRepo.findByIdPublic.mockResolvedValue(mockStudentPublic);

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.id).toBe(mockStudentPublic.id);
    });

    it('13. should reject expired access token', async () => {
      const token = getExpiredAccessToken();

      await new Promise((r) => setTimeout(r, 100));

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.error.message).toContain('expired');
    });

    it('14. should reject missing auth header', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error.message).toContain('Missing');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // AUTHORIZATION (RBAC)
  // ═══════════════════════════════════════════════════════════════
  describe('Authorization (RBAC)', () => {
    it('15. should allow student to access student-authorized route', async () => {
      const token = getValidAccessToken(mockStudentPublic.id, 'STUDENT');
      mockedUserRepo.findByIdPublic.mockResolvedValue(mockStudentPublic);

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('16. should allow admin to access admin-authorized route', async () => {
      const token = getValidAccessToken(mockAdminPublic.id, 'MESS_ADMIN');
      mockedUserRepo.findByIdPublic.mockResolvedValue(mockAdminPublic);

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // REFRESH TOKEN
  // ═══════════════════════════════════════════════════════════════
  describe('POST /api/auth/refresh', () => {
    it('17. should refresh tokens successfully', async () => {
      const mockRecord = createMockRefreshTokenRecord();
      mockedRefreshTokenRepo.findByToken.mockResolvedValue(mockRecord);
      mockedRefreshTokenRepo.revokeByToken.mockResolvedValue({});
      mockedRefreshTokenRepo.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refresh_token=${mockRecord.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user).toBeDefined();

      expect(mockedRefreshTokenRepo.revokeByToken).toHaveBeenCalledWith(mockRecord.token);
      expect(mockedRefreshTokenRepo.create).toHaveBeenCalled();
    });

    it('18. should reject expired refresh token', async () => {
      const mockRecord = createMockRefreshTokenRecord({
        expiresAt: new Date(Date.now() - 1000),
      });
      mockedRefreshTokenRepo.findByToken.mockResolvedValue(mockRecord);

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refresh_token=${mockRecord.token}`);

      expect(res.status).toBe(401);
      expect(res.body.error.message).toContain('expired');
    });
  });
});
