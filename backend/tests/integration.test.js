const request = require('supertest');
const mongoose = require('mongoose');
const { User, Challenge } = require('../models'); // Make sure this path is correct
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock OpenAI if needed
jest.mock('openai', () => ({
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [{ message: { content: "Test hint" } }]
      })
    }
  }
}));

const initTestApp = require('./testApp');
let app;

beforeAll(async () => {
  // Initialize app first
  app = await initTestApp();
  
  // Then connect to database
  await mongoose.connect(process.env.TEST_DB_URI || 'mongodb://localhost:27017/testdb');
  await mongoose.connection.dropDatabase();
});

afterAll(async () => {
  await mongoose.connection.close();
});

afterEach(async () => {
  if (mongoose.connection.readyState === 1) { // Check if connected
    await User.deleteMany({}).catch(() => {});
    await Challenge.deleteMany({}).catch(() => {});
  }
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
    expect(res.body).toHaveProperty('token');
  });

  test('User login', async () => {
    // First create a test user
    await User.create({
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
    expect(res.body).toHaveProperty('token');
  });
});

describe('Challenges API', () => {
  let authToken;
  let userId;

  beforeEach(async () => {
    const user = await User.create({
      username: 'challengeuser',
      email: 'challenge@test.com',
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
        title: 'Test Challenge',
        description: 'This is a proper challenge description',
        category: 'web',
        difficulty: 'easy',
        flag: 'flag{test-flag}'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
  });
});
