const request = require('supertest');
const mongoose = require('mongoose');
const { User, Challenge } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const initTestApp = require('./testApp');
let app;

// Increase timeout for beforeAll hook
jest.setTimeout(30000);

beforeAll(async () => {
  app = await initTestApp();
  
  // Clear any existing test data
  await User.deleteMany({});
  await Challenge.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
});

// Clean up database between tests
afterEach(async () => {
  await User.deleteMany({});
  await Challenge.deleteMany({});
});

describe('Auth API', () => {
  test('User registration - success', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!' // Add if your validation requires this
      });

    console.log('Registration response:', res.body);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('username', 'testuser');
    expect(res.body).toHaveProperty('email', 'test@example.com');
    expect(res.body).not.toHaveProperty('password'); // Ensure password isn't returned
  });

  test('User registration - invalid data', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        username: 'tu', // Too short
        email: 'invalid-email',
        password: '123', // Too short
        confirmPassword: '1234' // Doesn't match
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test('User login - success', async () => {
    // Create test user first with hashed password
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    await User.create({
      username: 'loginuser',
      email: 'login@test.com',
      password: hashedPassword
    });

    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'loginuser',
        password: 'Password123!'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.username).toBe('loginuser');
  });

  test('User login - invalid credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'nonexistent',
        password: 'wrongpassword'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid credentials');
  });
});

describe('Challenges API', () => {
  let authToken;
  let userId;

  beforeEach(async () => {
    // Create test user and get auth token
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const user = await User.create({
      username: 'challengeuser',
      email: 'challenge@test.com',
      password: hashedPassword,
      points: 1000,
      role: 'admin' // Ensure user has permission to create challenges
    });
    
    userId = user._id;
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET);
  });

  test('Create challenge - success', async () => {
    const challengeData = {
      title: 'Test Challenge',
      description: 'This is a test challenge with proper length (minimum 20 characters)',
      category: 'web',
      difficulty: 'easy',
      flag: 'flag{test-flag}',
      points: 100,
      hints: ['First hint'],
      solution: 'This is the solution'
    };

    const res = await request(app)
      .post('/api/challenges')
      .set('Authorization', `Bearer ${authToken}`)
      .send(challengeData);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe(challengeData.title);
    expect(res.body.author.toString()).toBe(userId.toString());
  });

  test('Create challenge - unauthorized', async () => {
    const challengeData = {
      title: 'Unauthorized Challenge',
      description: 'Should fail without auth token'
    };

    const res = await request(app)
      .post('/api/challenges')
      .send(challengeData);

    expect(res.statusCode).toBe(401);
  });

  test('Create challenge - invalid data', async () => {
    const challengeData = {
      title: 'Short', // Too short
      description: 'Short', // Too short
      category: 'invalid' // Invalid category
    };

    const res = await request(app)
      .post('/api/challenges')
      .set('Authorization', `Bearer ${authToken}`)
      .send(challengeData);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
});
