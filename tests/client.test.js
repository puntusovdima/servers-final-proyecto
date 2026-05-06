import request from 'supertest';
import app from '../src/app.js';

describe('Client API', () => {
  let token = '';
  const testUser = {
    email: 'client_tester@example.com',
    password: 'Password123_at_least_32_chars_long'
  };

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send(testUser);
    
    token = res.body.data.accessToken;

    await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Company',
        cif: 'A12345678',
        isFreelance: false,
        address: {
          street: 'Test St',
          number: '1',
          postal: '28001',
          city: 'Madrid',
          province: 'Madrid'
        }
      });
  });

  describe('POST /api/client', () => {
    it('should create a new client', async () => {
      const clientData = {
        name: 'Client One',
        cif: 'B11111111',
        email: 'one@client.com',
        phone: '123456789',
        address: {
          street: 'Client St',
          number: '10',
          postal: '28002',
          city: 'Madrid',
          province: 'Madrid'
        }
      };

      const res = await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send(clientData)
        .expect(201);

      expect(res.body.data.client.name).toBe('Client One');
      expect(res.body.data.client.cif).toBe('B11111111');
    });

    it('should not allow duplicate CIF in same company', async () => {
      const clientData = {
        name: 'Client One',
        cif: 'B11111111',
        email: 'one@client.com',
        phone: '123456789',
        address: {
          street: 'Client St',
          number: '10',
          postal: '28002',
          city: 'Madrid',
          province: 'Madrid'
        }
      };

      await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send(clientData);

      const res = await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send(clientData)
        .expect(409);

      expect(res.body.status).toBe('error');
    });
  });

  describe('GET /api/client', () => {
    it('should return a list of clients', async () => {
      await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Client One',
          cif: 'B11111111',
          email: 'one@client.com',
          phone: '123456789',
          address: { street: 'S', number: '1', postal: '1', city: 'C', province: 'P' }
        });

      const res = await request(app)
        .get('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.clients).toHaveLength(1);
    });
  });
});
