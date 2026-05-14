import request from 'supertest';
import app from '../src/app.js';

describe('DeliveryNote validator — discriminatedUnion', () => {
  let token;
  let clientId;
  let projectId;

  beforeEach(async () => {
    const reg = await request(app)
      .post('/api/user/register')
      .send({ email: 'validator_test@example.com', password: 'Password123_long_enough' });

    token = reg.body.data.accessToken;

    await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Validator Co',
        cif: 'V99999999',
        isFreelance: false,
        address: { street: 'S', number: '1', postal: '1', city: 'C', province: 'P' }
      });

    const clientRes = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Val Client',
        cif: 'V11111111',
        email: 'val@client.com',
        phone: '123456789',
        address: { street: 'S', number: '1', postal: '1', city: 'C', province: 'P' }
      });

    clientId = clientRes.body.data.client._id;

    const projectRes = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({
        client: clientId,
        name: 'Val Project',
        projectCode: 'VAL-001',
        email: 'val@project.com',
        address: { street: 'S', number: '1', postal: '1', city: 'C', province: 'P' }
      });

    projectId = projectRes.body.data.project._id;
  });

  it('POST /api/deliverynote with format:material missing material field returns 400', async () => {
    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: projectId,
        client: clientId,
        format: 'material',
        description: 'Missing material field',
        workDate: '2024-03-20'
        // material is intentionally omitted
      });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('POST /api/deliverynote with format:material and valid material field returns 201', async () => {
    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: projectId,
        client: clientId,
        format: 'material',
        material: 'Cemento Portland 50kg',
        description: 'Suministro de material',
        workDate: '2024-03-20'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.deliveryNote.format).toBe('material');
    expect(res.body.data.deliveryNote.material).toBe('Cemento Portland 50kg');
  });

  it('POST /api/deliverynote with format:hours missing hours field returns 400', async () => {
    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: projectId,
        client: clientId,
        format: 'hours',
        description: 'Missing hours field',
        workDate: '2024-03-20'
        // hours is intentionally omitted
      });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('POST /api/deliverynote with format:hours and workers array returns 201', async () => {
    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: projectId,
        client: clientId,
        format: 'hours',
        hours: 6,
        workers: [],
        description: 'Jornada con trabajadores',
        workDate: '2024-03-21'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.deliveryNote.format).toBe('hours');
  });
});
