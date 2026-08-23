require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { app, connectDatabase } = require('../server');
const User = require('../models/User');

const adminId = new mongoose.Types.ObjectId();
const adminToken = jwt.sign(
  { id: adminId.toString(), email: 'admintest@example.com', role: 'admin' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

const userId = new mongoose.Types.ObjectId();
const userToken = jwt.sign(
  { id: userId.toString(), email: 'normaluser@example.com', role: 'user' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

let targetUserId;
const targetEmail = `admintarget_${Date.now()}@example.com`;

beforeAll(async () => {
  await connectDatabase();
  const passwordHash = await bcrypt.hash('123456', 10);
  const targetUser = await User.create({
    email: targetEmail,
    passwordHash,
    name: 'Target User',
    role: 'user'
  });
  targetUserId = targetUser._id.toString();
});

afterAll(async () => {
  await User.deleteMany({ email: targetEmail });
  await mongoose.connection.close();
});

describe('Admin routes (protected)', () => {
  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/admin/overview');
    expect(res.statusCode).toBe(401);
  });

  it('rejects requests from non-admin users', async () => {
    const res = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('returns overview stats for admin', async () => {
    const res = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('usersCount');
    expect(res.body).toHaveProperty('projectsCount');
    expect(res.body).toHaveProperty('tasksCount');
  });

  it('returns tasks grouped by priority', async () => {
    const res = await request(app)
      .get('/api/admin/tasks-by-priority')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(typeof res.body).toBe('object');
  });

  it('rejects invalid date range in tasks-by-priority', async () => {
    const res = await request(app)
      .get('/api/admin/tasks-by-priority?from=not-a-date')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(400);
  });

  it('lists users with pagination', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('searches users by email', async () => {
    const res = await request(app)
      .get(`/api/admin/users?search=${targetEmail}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.some(u => u.email === targetEmail)).toBe(true);
  });

  it('updates a user role', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${targetUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('admin');
  });

  it('rejects invalid role value', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${targetUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'superuser' });
    expect(res.statusCode).toBe(400);
  });

  it('updates a user status', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${targetUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'suspended' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('suspended');
  });

  it('rejects invalid status value', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${targetUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'banned' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when updating role of nonexistent user', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/admin/users/${fakeId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' });
    expect(res.statusCode).toBe(404);
  });

  it('rejects invalid ObjectId in param', async () => {
    const res = await request(app)
      .patch('/api/admin/users/not-an-objectid/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' });
    expect(res.statusCode).toBe(400);
  });
});
