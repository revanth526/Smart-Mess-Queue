import request from 'supertest';
import app from '../app';

describe('Health Check', () => {
  it('GET /api/health should return 200 with status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.database).toBe('connected');
    expect(res.body.data).toHaveProperty('timestamp');
    expect(res.body.data).toHaveProperty('uptime');
  });
});
