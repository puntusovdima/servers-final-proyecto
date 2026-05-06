import request from 'supertest';
import app from '../src/app.js';

describe('DeliveryNote API', () => {
  let token = '';
  let clientId = '';
  let projectId = '';
  const testUser = {
    email: 'note_tester@example.com',
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
        address: { street: 'S', number: '1', postal: '1', city: 'C', province: 'P' }
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

    const projectRes = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({
        client: clientId,
        name: 'Project Alpha',
        projectCode: 'ALPHA-001',
        email: 'alpha@project.com',
        address: { street: 'S', number: '1', postal: '1', city: 'C', province: 'P' }
      });
    
    projectId = projectRes.body.data.project._id;
  });

  describe('POST /api/deliverynote', () => {
    it('should create a new delivery note (hours)', async () => {
      const noteData = {
        project: projectId,
        client: clientId,
        format: 'hours',
        hours: 8,
        description: 'Jornada completa',
        workDate: '2024-03-20'
      };

      const res = await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .send(noteData)
        .expect(201);

      expect(res.body.data.deliveryNote.format).toBe('hours');
      expect(res.body.data.deliveryNote.hours).toBe(8);
    });

    it('should fail if hours is missing in hours format', async () => {
      const noteData = {
        project: projectId,
        client: clientId,
        format: 'hours',
        description: 'Missing hours',
        workDate: '2024-03-20'
      };

      await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .send(noteData)
        .expect(400);
    });
  });

  describe('GET /api/deliverynote', () => {
    it('should return paginated delivery notes', async () => {
      await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .send({
          project: projectId,
          client: clientId,
          format: 'hours',
          hours: 4,
          description: 'Half day',
          workDate: '2024-03-21'
        });

      const res = await request(app)
        .get('/api/deliverynote?limit=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.deliveryNotes).toHaveLength(1);
      expect(res.body.data.pagination.totalItems).toBe(1);
    });
  });
});
