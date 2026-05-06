import request from 'supertest';
import app from '../src/app.js';

describe('Project API', () => {
  let token = '';
  let clientId = '';
  const testUser = {
    email: 'project_tester@example.com',
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

    const clientRes = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Client One',
        cif: 'B11111111',
        email: 'one@client.com',
        phone: '123456789',
        address: { street: 'S', number: '1', postal: '1', city: 'C', province: 'P' }
      });
    
    clientId = clientRes.body.data.client._id;
  });

  describe('POST /api/project', () => {
    it('should create a new project', async () => {
      const projectData = {
        client: clientId,
        name: 'Project Alpha',
        projectCode: 'ALPHA-001',
        email: 'alpha@project.com',
        address: {
          street: 'Project St',
          number: '100',
          postal: '28003',
          city: 'Madrid',
          province: 'Madrid'
        }
      };

      const res = await request(app)
        .post('/api/project')
        .set('Authorization', `Bearer ${token}`)
        .send(projectData)
        .expect(201);

      expect(res.body.data.project.name).toBe('Project Alpha');
      expect(res.body.data.project.client).toBe(clientId);
    });

    it('should fail if client does not exist', async () => {
      const projectData = {
        client: '65f8b3a2c9d1e20012345678', // Fake ID
        name: 'Project Alpha',
        projectCode: 'ALPHA-001',
        email: 'alpha@project.com',
        address: { street: 'S', number: '1', postal: '1', city: 'C', province: 'P' }
      };

      await request(app)
        .post('/api/project')
        .set('Authorization', `Bearer ${token}`)
        .send(projectData)
        .expect(404);
    });
  });
});
