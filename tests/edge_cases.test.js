import request from 'supertest';
import app from '../src/app.js';

describe('Edge Cases & Missing Endpoints', () => {
  let token = '';
  let clientId = '';
  let projectId = '';
  let noteId = '';

  beforeEach(async () => {
    // Setup user
    const res = await request(app).post('/api/user/register').send({
      email: `edge_${Date.now()}@example.com`,
      password: 'Password123_at_least_32_chars_long'
    });
    token = res.body.data.accessToken;

    // Create company
    await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Edge Corp',
        cif: 'B12312312',
        isFreelance: false,
        address: { street: 'S', number: '1', postal: '1', city: 'C', province: 'P' }
      });
  });

  it('Client CRUD - update, get, delete', async () => {
    // Create
    const createRes = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Edge Client',
        cif: 'C11111111',
        email: 'edge@client.com',
        phone: '111222333',
        address: { street: 'S', number: '1', postal: '1', city: 'C', province: 'P' }
      });
    clientId = createRes.body.data.client._id;

    // Get Single
    await request(app)
      .get(`/api/client/${clientId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Update
    await request(app)
      .put(`/api/client/${clientId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Edge Client' })
      .expect(200);

    // Delete
    await request(app)
      .delete(`/api/client/${clientId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('Project CRUD - update, get', async () => {
    // Create client
    const clientRes = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Project Client',
        cif: 'C22222222',
        email: 'p@client.com',
        phone: '111',
        address: { street: 'S', number: '1', postal: '1', city: 'C', province: 'P' }
      });
    clientId = clientRes.body.data.client._id;

    // Create Project
    const projRes = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({
        client: clientId,
        name: 'Edge Project',
        projectCode: 'EP-001',
        email: 'e@p.com',
        address: { street: 'S', number: '1', postal: '1', city: 'C', province: 'P' }
      });
    projectId = projRes.body.data.project._id;

    // Get Single
    await request(app)
      .get(`/api/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Update
    await request(app)
      .put(`/api/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Project' })
      .expect(200);
  });

  it('DeliveryNote CRUD - update, get, delete', async () => {
    // Create client & project
    const clientRes = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'N Client', cif: 'CN', email: 'n@c.com', phone: '1',
        address: { street: 'S', number: '1', postal: '1', city: 'C', province: 'P' }
      });
    clientId = clientRes.body.data.client._id;

    const projRes = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({
        client: clientId, name: 'N Project', projectCode: 'NP', email: 'n@p.com',
        address: { street: 'S', number: '1', postal: '1', city: 'C', province: 'P' }
      });
    projectId = projRes.body.data.project._id;

    // Create Note
    const noteRes = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: projectId,
        client: clientId,
        format: 'hours',
        hours: 5,
        description: 'Edge Note',
        workDate: '2024-03-25'
      });
    noteId = noteRes.body.data.deliveryNote._id;

    // Get Single
    await request(app)
      .get(`/api/deliverynote/${noteId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Update
    await request(app)
      .put(`/api/deliverynote/${noteId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ hours: 10 })
      .expect(200);

    // List with filters
    await request(app)
      .get(`/api/deliverynote?project=${projectId}&client=${clientId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Delete
    await request(app)
      .delete(`/api/deliverynote/${noteId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
