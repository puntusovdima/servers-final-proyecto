import request from 'supertest';
import app from '../src/app.js';
import fs from 'fs';
import path from 'path';

async function runDemo() {
  console.log('🚀 Starting Final Demo...');

  // 1. Register & Setup
  console.log('📝 Registering user...');
  const regRes = await request(app).post('/api/user/register').send({
    email: 'demo_user@example.com',
    password: 'Password123_demo'
  });
  const token = regRes.body.data.accessToken;

  console.log('🏢 Creating company...');
  await request(app)
    .patch('/api/user/company')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Demo Constructions S.L.',
      cif: 'B99999999',
      isFreelance: false,
      address: { street: 'Main St', number: '123', postal: '28001', city: 'Madrid', province: 'Madrid' }
    });

  console.log('👤 Creating client...');
  const clientRes = await request(app)
    .post('/api/client')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Big Client Corp',
      cif: 'B88888888',
      email: 'client@demo.com',
      phone: '911223344',
      address: { street: 'Business St', number: '1', postal: '28002', city: 'Madrid', province: 'Madrid' }
    });
  const clientId = clientRes.body.data.client._id;

  console.log('🏗️ Creating project...');
  const projRes = await request(app)
    .post('/api/project')
    .set('Authorization', `Bearer ${token}`)
    .send({
      client: clientId,
      name: 'Skyline Tower',
      projectCode: 'ST-001',
      email: 'skyline@demo.com',
      address: { street: 'Sky St', number: '10', postal: '28003', city: 'Madrid', province: 'Madrid' }
    });
  const projectId = projRes.body.data.project._id;

  console.log('📄 Creating delivery note...');
  const noteRes = await request(app)
    .post('/api/deliverynote')
    .set('Authorization', `Bearer ${token}`)
    .send({
      project: projectId,
      client: clientId,
      format: 'hours',
      hours: 45,
      description: 'Weekly structural reinforcement works at Skyline Tower.',
      workDate: new Date().toISOString().split('T')[0]
    });
  const noteId = noteRes.body.data.deliveryNote._id;

  console.log('✍️ Signing delivery note with Sharp optimization...');
  // Use the dummy signature we created earlier
  const signRes = await request(app)
    .patch(`/api/deliverynote/${noteId}/sign`)
    .set('Authorization', `Bearer ${token}`)
    .attach('signature', 'temp/dummy_signature.png');

  console.log('✅ Demo complete!');
  console.log('\n--- RESULTS ---');
  console.log('Project Status: Active');
  console.log('Delivery Note ID:', noteId);
  console.log('Signed:', signRes.body.data.deliveryNote.signed);
  console.log('Signature URL:', signRes.body.data.deliveryNote.signatureUrl);
  console.log('PDF URL:', signRes.body.data.deliveryNote.pdfUrl);
  
  const pdfPath = path.join(process.cwd(), signRes.body.data.deliveryNote.pdfUrl);
  console.log('Local PDF Path:', pdfPath);
  
  if (fs.existsSync(pdfPath)) {
    console.log('📄 PDF file generated successfully at the location above.');
  }
}

runDemo().catch(console.error);
