import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';

describe('User Full API', () => {
  let token = '';
  let testUser = {
    email: 'full_user_fixed_v2@example.com',
    password: 'Password123_at_least_32_chars_long'
  };

  beforeEach(async () => {
    const res = await request(app).post('/api/user/register').send(testUser);
    token = res.body.data.accessToken;

    // Validate email to avoid any potential status issues
    const user = await User.findOne({ email: testUser.email });
    await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: user.verificationCode })
      .expect(200);
  });

  it('GET /api/user - should get authenticated user data', async () => {
    const res = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.data.user.email).toBe(testUser.email);
  });

  it('PUT /api/user/register - should update personal data', async () => {
    await request(app)
      .put('/api/user/register')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'John',
        lastName: 'Doe',
        nif: '12345678Z',
        phone: '600000000'
      })
      .expect(200);
  });

  it('PATCH /api/user/company - should create/update company', async () => {
    const res = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Full Corp',
        cif: 'B87654321',
        address: { street: 'S', number: '1', postal: '1', city: 'C', province: 'P' },
        isFreelance: false
      })
      .expect(200);
    expect(res.body.data.company.name).toBe('Full Corp');
  });

  it('PATCH /api/user/logo - should upload company logo', async () => {
    // Need a company first
    await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Full Corp',
        cif: 'B87654321',
        address: { street: 'S', number: '1', postal: '1', city: 'C', province: 'P' },
        isFreelance: false
      });

    const res = await request(app)
      .patch('/api/user/logo')
      .set('Authorization', `Bearer ${token}`)
      .attach('logo', 'temp/dummy_signature.png')
      .expect(200);
    expect(res.body.data.company.logo).toBeDefined();
  });

  it('POST /api/user/invite - should invite a peer (admin only)', async () => {
    // Need a company first
    await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Full Corp',
        cif: 'B87654321',
        address: { street: 'S', number: '1', postal: '1', city: 'C', province: 'P' },
        isFreelance: false
      });

    const res = await request(app)
      .post('/api/user/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'invited_full@example.com' })
      .expect(201);
    expect(res.body.data.email).toBe('invited_full@example.com');
  });

  it('PUT /api/user/password - should change password', async () => {
    await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        oldPassword: testUser.password,
        newPassword: 'NewPassword123_at_least_32_chars_long'
      })
      .expect(200);
  });

  it('DELETE /api/user - should soft delete user', async () => {
    await request(app)
      .delete('/api/user?soft=true')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    
    const user = await User.findOne({ email: testUser.email });
    expect(user.deleted).toBe(true);
  });
});
