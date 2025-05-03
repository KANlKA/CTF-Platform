const request = require('supertest');
const mongoose = require('mongoose');
const { User, Challenge } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const initTestApp = require('./testApp');
let app;

beforeAll(async () => {
  app = await initTestApp();
  
  // Clear collections instead of dropping database
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
});

afterEach(async () => {
  // Clean specific collections between tests
  await User.deleteMany({});
  await Challenge.deleteMany({});
});

describe('Auth API', () => {
  test('User registration', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        username: 'testuser-' + Date.now(), // Unique username
        email: `test-${Date.now()}@example.com`, // Unique email
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
  });

  test('User login', async () => {
    const username = 'loginuser-' + Date.now();
    const email = `login-${Date.now()}@test.com`;
    
    await User.create({
      username,
      email,
      password: await bcrypt.hash('Password123!', 10)
    });

    const res = await request(app)
      .post('/api/login')
      .send({
        username,
        password: 'Password123!'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});

describe('Challenges API', () => {
  let authToken;
  let userId;

  beforeEach(async () => {
    const username = 'challengeuser-' + Date.now();
    const user = await User.create({
      username,
      email: `challenge-${Date.now()}@test.com`,
      password: await bcrypt.hash('Password123!', 10),
      role: 'admin'
    });
    userId = user._id;
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET);
  });

  test('Create challenge', async () => {
    const res = await request(app)
      .post('/api/challenges')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Challenge ' + Date.now(),
        description: 'This is a test challenge with proper length',
        category: 'web',
        difficulty: 'easy',
        flag: 'flag{test-flag}',
        hints: []
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
  });
});
