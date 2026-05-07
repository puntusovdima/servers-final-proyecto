import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import mongoose from 'mongoose';

describe('Comprehensive Integration Tests', () => {
  let adminToken, guestToken, otherCompanyToken;
  let adminId, guestId;
  let clientId, projectId;

  beforeEach(async () => {
    // 1. Setup Admin
    const adminRes = await request(app).post('/api/user/register').send({
      email: `admin_${Date.now()}_${Math.random()}@test.com`, password: 'Password123_ext'
    });
    adminToken = adminRes.body.data.accessToken;
    adminId = adminRes.body.data.user._id;

    // 2. Setup Guest in same company
    const guestRes = await request(app).post('/api/user/register').send({
      email: `guest_${Date.now()}_${Math.random()}@test.com`, password: 'Password123_ext'
    });
    guestToken = guestRes.body.data.accessToken;
    guestId = guestRes.body.data.user._id;
    
    await request(app).patch('/api/user/company').set('Authorization', `Bearer ${adminToken}`).send({
      name: 'Ext Corp', cif: 'B111', isFreelance: false, address: { street: 'S', number: '1', postal: '1', city: 'C', province: 'P' }
    });
    const adminUser = await User.findById(adminId);
    await User.findByIdAndUpdate(guestId, { company: adminUser.company, role: 'guest' });

    // 3. Setup User in ANOTHER company
    const otherRes = await request(app).post('/api/user/register').send({
      email: `other_${Date.now()}_${Math.random()}@test.com`, password: 'Password123_ext'
    });
    otherCompanyToken = otherRes.body.data.accessToken;
    await request(app).patch('/api/user/company').set('Authorization', `Bearer ${otherCompanyToken}`).send({
      name: 'Other Corp', cif: 'B222', isFreelance: false, address: { street: 'S', number: '1', postal: '1', city: 'C', province: 'P' }
    });

    // 4. Setup Project/Client in Company A
    const clientRes = await request(app).post('/api/client').set('Authorization', `Bearer ${adminToken}`).send({
      name: 'Client A', cif: 'A1', email: 'a@c.com', phone: '1', 
      address: { street: 'S', number: '1', postal: '1', city: 'C', province: 'P' }
    });
    clientId = clientRes.body.data.client._id;
    const projRes = await request(app).post('/api/project').set('Authorization', `Bearer ${adminToken}`).send({
      client: clientId, name: 'Project A', projectCode: 'PA', email: 'a@p.com', 
      address: { street: 'S', number: '1', postal: '1', city: 'C', province: 'P' }
    });
    projectId = projRes.body.data.project._id;
  });

  describe('User & Auth Features', () => {
    it('should handle token rotation (refresh)', async () => {
      const admin = await User.findById(adminId).select('+refreshToken');
      const res = await request(app)
        .post('/api/user/refresh')
        .send({ refreshToken: admin.refreshToken })
        .expect(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should handle logout', async () => {
      await request(app)
        .post('/api/user/logout')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should trigger 409 for duplicate registration', async () => {
      const admin = await User.findById(adminId);
      await request(app)
        .post('/api/user/register')
        .send({ email: admin.email, password: 'password' })
        .expect(409);
    });
  });

  describe('RBAC & Isolation', () => {
    it('guest should not invite', async () => {
      await request(app)
        .post('/api/user/invite')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ email: 'new@test.com' })
        .expect(403);
    });

    it('other company should not see project', async () => {
      await request(app)
        .get(`/api/project/${projectId}`)
        .set('Authorization', `Bearer ${otherCompanyToken}`)
        .expect(404);
    });
  });

  describe('CRUD Edge Cases', () => {
    it('should return 404 for invalid ID format', async () => {
      await request(app)
        .get('/api/project/invalid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent client update', async () => {
      await request(app)
        .put(`/api/client/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Update' })
        .expect(404);
    });
  });

  describe('Monitoring', () => {
    it('should trigger 500 error', async () => {
      await request(app).get('/api/test/error').expect(500);
    });
  });
});
