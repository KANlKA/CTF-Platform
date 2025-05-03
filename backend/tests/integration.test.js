const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const initTestApp = require('./testApp');
let app;

beforeAll(async () => {
  app = await initTestApp();
  
  // Initialize collections if they don't exist
  await mongoose.connection.db.collection('users').createIndex({ username: 1 }, { unique: true });
  await mongoose.connection.db.collection('challenges').createIndex({ title: 1 }, { unique: true });
});

afterAll(async () => {
  await mongoose.connection.close();
});

afterEach(async () => {
  // Skip cleanup if not connected
  if (mongoose.connection.readyState !== 1) return;
  
  await mongoose.connection.db.collection('users').deleteMany({});
  await mongoose.connection.db.collection('challenges').deleteMany({});
});

describe('Auth API', () => {
  test('User registration', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!'
      });
    expect(res.statusCode).toBe(201);
  });

  test('User login', async () => {
    // Create test user directly
    await mongoose.connection.db.collection('users').insertOne({
      username: 'loginuser',
      email: 'login@test.com',
      password: await bcrypt.hash('Password123!', 10)
    });

    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'loginuser',
        password: 'Password123!'
      });
    expect(res.statusCode).toBe(200);
  });
});

describe('Challenges API', () => {
  let authToken;

  beforeEach(async () => {
    // Create test user and get token
    const user = {
      username: 'challengeuser',
      email: 'challenge@test.com',
      password: await bcrypt.hash('Password123!', 10),
      role: 'admin'
    };
    await mongoose.connection.db.collection('users').insertOne(user);
    authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  });

  test('Create challenge', async () => {
    const res = await request(app)
      .post('/api/challenges')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Challenge',
        description: 'This is a test challenge',
        category: 'web',
        difficulty: 'easy',
        flag: 'flag{test-flag}'
      });
    expect(res.statusCode).toBe(201);
  });
});
