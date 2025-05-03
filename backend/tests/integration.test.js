const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const initTestApp = require('./testApp');
let app;

beforeAll(async () => {
  app = await initTestApp();
  
  // Wait for connection to be ready
  await mongoose.connection.asPromise();
  
  // Clear collections using direct MongoDB driver
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  
  await Promise.all(
    collections.map(collection => 
      db.collection(collection.name).deleteMany({})
    )
  );
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
});

afterEach(async () => {
  if (mongoose.connection.readyState !== 1) return;
  const db = mongoose.connection.db;
  await db.collection('users').deleteMany({});
  await db.collection('challenges').deleteMany({});
});

describe('Auth API', () => {
  test('User registration', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        username: 'testuser-' + Date.now(),
        email: `test-${Date.now()}@example.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
  });

  test('User login', async () => {
    const username = 'loginuser-' + Date.now();
    const password = 'Password123!';
    
    await mongoose.connection.db.collection('users').insertOne({
      username,
      email: `login-${Date.now()}@test.com`,
      password: await bcrypt.hash(password, 10)
    });

    const res = await request(app)
      .post('/api/login')
      .send({ username, password });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});

describe('Challenges API', () => {
  let authToken;
  let userId;

  beforeEach(async () => {
    const username = 'challengeuser-' + Date.now();
    const user = await mongoose.connection.db.collection('users').insertOne({
      username,
      email: `challenge-${Date.now()}@test.com`,
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
        title: 'Test Challenge ' + Date.now(),
        description: 'This is a test challenge',
        category: 'web',
        difficulty: 'easy',
        flag: 'flag{test-flag}'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
  });
});
