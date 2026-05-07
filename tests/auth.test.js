import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';

describe('Auth API', () => {
  const testUser = {
    email: 'auth_tester@example.com',
    password: 'Password123_at_least_32_chars_long'
  };

  describe('POST /api/user/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/user/register')
        .send(testUser)
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should not register a user that already exists', async () => {
      await request(app).post('/api/user/register').send(testUser);
      
      const res = await request(app)
        .post('/api/user/register')
        .send(testUser)
        .expect(409);

      expect(res.body.status).toBe('error');
    });
  });

  describe('PUT /api/user/validation', () => {
    it('should validate email with correct code', async () => {
      // Register
      const regRes = await request(app).post('/api/user/register').send(testUser);
      const token = regRes.body.data.accessToken;

      // Get code from DB
      const user = await User.findOne({ email: testUser.email });
      const code = user.verificationCode;

      const res = await request(app)
        .put('/api/user/validation')
        .set('Authorization', `Bearer ${token}`)
        .send({ code })
        .expect(200);

      expect(res.body.status).toBe('success');
      
      const updatedUser = await User.findOne({ email: testUser.email });
      expect(updatedUser.status).toBe('verified');
    });

    it('should return error with incorrect code', async () => {
      const regRes = await request(app).post('/api/user/register').send(testUser);
      const token = regRes.body.data.accessToken;

      const res = await request(app)
        .put('/api/user/validation')
        .set('Authorization', `Bearer ${token}`)
        .send({ code: '000000' })
        .expect(401);

      expect(res.body.status).toBe('error');
    });
  });

  describe('POST /api/user/login', () => {
    it('should login and return tokens', async () => {
      await request(app).post('/api/user/register').send(testUser);

      const res = await request(app)
        .post('/api/user/login')
        .send(testUser)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should fail with wrong password', async () => {
      await request(app).post('/api/user/register').send(testUser);

      const res = await request(app)
        .post('/api/user/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(401);

      expect(res.body.status).toBe('error');
    });
  });
});
