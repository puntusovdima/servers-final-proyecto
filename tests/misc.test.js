import request from 'supertest';
import app from '../src/app.js';

describe('Miscellaneous API', () => {
  describe('GET /health', () => {
    it('should return server health information', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);

      expect(res.body.status).toBe('ok');
      expect(res.body.db).toBeDefined();
      expect(res.body.uptime).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app)
        .get('/api/unknown-route')
        .expect(404);

      expect(res.body.status).toBe('error');
    });

    it('should return 401 for protected routes without token', async () => {
      const res = await request(app)
        .get('/api/client')
        .expect(401);

      expect(res.body.status).toBe('error');
    });
  });
});
