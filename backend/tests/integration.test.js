const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const initTestApp = require('./testApp');
let app;

// Test database configuration
const TEST_DB_URI = process.env.TEST_DB_URI || 'mongodb://localhost:27017/testdb';

beforeAll(async () => {
  app = await initTestApp();
  
  // Connect with authentication if needed
  await mongoose.connect(TEST_DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
  });

  // Clear all collections instead of dropping database
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

afterEach(async () => {
  // Clean up specific collections between tests
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
    expect(res.body).toHaveProperty('token');
  });

  test('User login', async () => {
    // Create user directly in the test database
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
    expect(res.body).toHaveProperty('token');
  });
});

describe('Challenges API', () => {
  let authToken;
  let userId;

  beforeEach(async () => {
    // Create test user directly
    const user = await mongoose.connection.db.collection('users').insertOne({
      username: 'challengeuser',
      email: 'challenge@test.com',
      password: await bcrypt.hash('Password123!', 10),
      role: 'admin'
    });
    userId = user.insertedId;
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
