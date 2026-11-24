const request = require('supertest');
const app = require('../app');
const prisma = require('../lib/prisma');

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
  },
  $queryRaw: jest.fn(),
}));

describe('Health Check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/health should return 200 with status when db is connected', async () => {
    (prisma.$queryRaw || prisma.default.$queryRaw).mockResolvedValue([{ 1: 1 }]);

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.database).toBe('connected');
    expect(res.body.data).toHaveProperty('timestamp');
    expect(res.body.data).toHaveProperty('uptime');
  });

  it('GET /api/health should return 503 when db connection fails', async () => {
    (prisma.$queryRaw || prisma.default.$queryRaw).mockRejectedValue(new Error('DB unreachable'));

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(res.body.error.message).toBe('Database connection failed');
  });
});
