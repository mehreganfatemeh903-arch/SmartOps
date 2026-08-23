require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { app, connectDatabase } = require('../server');
const Task = require('../models/Task');

const fakeUserId = new mongoose.Types.ObjectId();
const token = jwt.sign(
  { id: fakeUserId.toString(), email: 'taskuser@example.com', role: 'user' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

let createdTaskId;

beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  await Task.deleteMany({ userId: fakeUserId });
  await mongoose.connection.close();
});

describe('Tasks routes (authenticated)', () => {
  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.statusCode).toBe(401);
  });

  it('creates a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Write tests', priority: 'high' });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Write tests');
    createdTaskId = res.body._id;
  });

  it('rejects task creation with empty title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '' });

    expect(res.statusCode).toBe(400);
  });

  it('lists tasks for the authenticated user', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(t => t._id === createdTaskId)).toBe(true);
  });

  it('returns task stats', async () => {
    const res = await request(app)
      .get('/api/tasks/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('byPriority');
  });

  it('updates the created task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'done' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('done');
  });

  it('returns 404 when updating a nonexistent task', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/tasks/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'done' });

    expect(res.statusCode).toBe(404);
  });

  it('deletes the created task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
