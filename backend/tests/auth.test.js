require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const { app, connectDatabase } = require('../server');
const User = require('../models/User');
const testEmail = `testuser_${Date.now()}@example.com`;
const testPassword = '123456';
beforeAll(async () => {
  await connectDatabase();
});
afterAll(async () => {
  await User.deleteMany({ email: testEmail });
  await mongoose.connection.close();
});
describe('POST /api/auth/register', () => {
  it('registers a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword, name: 'Test User' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe(testEmail);
    expect(res.body.role).toBe('user');
  });
  it('rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword, name: 'Test User' });
    expect(res.statusCode).toBe(409);
  });
  it('rejects invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: testPassword });
    expect(res.statusCode).toBe(400);
  });
  it('rejects short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: `another_${Date.now()}@example.com`, password: '123' });
    expect(res.statusCode).toBe(400);
  });
});
describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testEmail);
  });
  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
  });
  it('rejects unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'doesnotexist@example.com', password: testPassword });
    expect(res.statusCode).toBe(401);
  });
});
