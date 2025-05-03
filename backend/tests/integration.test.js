const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const createTestApp = require('./testApp');
let app;
let mongoServer;

beforeAll(async () => {
  // Create in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Connect to MongoDB
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // Create test app
  app = await createTestApp();
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clear all collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Auth API', () => {
  const testUser = {
    username: `testuser${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'Password123!'
  };

  test('User registration', async () => {
    const res = await request(app)
      .post('/api/register')
      .send(testUser);
    
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
  });

  test('User login', async () => {
    // First register
    await request(app).post('/api/register').send(testUser);
    
    // Then login
    const res = await request(app)
      .post('/api/login')
      .send({
        username: testUser.username,
        password: testUser.password
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});

describe('Challenges API', () => {
  let authToken;

  beforeEach(async () => {
    // Register test user
    const testUser = {
      username: `challengeuser${Date.now()}`,
      email: `challenge${Date.now()}@test.com`,
      password: 'Password123!'
    };
    
    const regRes = await request(app)
      .post('/api/register')
      .send(testUser);
    
    authToken = regRes.body.token;
  });

  test('Create challenge', async () => {
    const res = await request(app)
      .post('/api/challenges')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: `Test Challenge ${Date.now()}`,
        description: 'This is a test challenge',
        category: 'web',
        difficulty: 'easy',
        flag: 'flag{test-flag}'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
  });
});
