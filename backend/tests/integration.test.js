const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const initTestApp = require('./testApp');
let app;
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
beforeAll(async () => {
  app = await initTestApp();
  await mongoose.connection.asPromise();
  await mongoose.connection.db.admin().command({ ping: 1 });
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
  let testUser = {
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
    await request(app).post('/api/register').send(testUser);
  
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
