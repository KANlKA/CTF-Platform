const request = require('supertest');
const { app } = require('../server');
const { User, Challenge } = require('../models');// Import models directly
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Auth API', () => {
  test('User registration', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    expect(res.statusCode).toBe(201);
  });

  test('User login', async () => {
    // Create test user first
    await User.create({
      username: 'loginuser',
      email: 'login@test.com',
      password: await bcrypt.hash('password123', 10)
    });

    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'loginuser',
        password: 'password123'
      });
    expect(res.statusCode).toBe(200);
  });
});

describe('Challenges API', () => {
    let authToken;
    let userId;
  
    beforeEach(async () => {
      // Create test user
      const user = await User.create({
        username: 'challengeuser',
        email: 'challenge@test.com',
        password: await bcrypt.hash('password123', 10),
        points: 1000 // Ensure user has enough points
      });
      userId = user._id;
      authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET);
    });
  
    test('Create challenge', async () => {
      const challengeData = {
        title: 'Test Challenge',
        description: 'This is a test challenge with proper length',
        category: 'web',
        difficulty: 'easy',
        flag: 'flag{test-flag}',
        hints: [] // Add empty hints array if required
      };
  
      const res = await request(app)
        .post('/api/challenges')
        .set('Authorization', `Bearer ${authToken}`)
        .send(challengeData);
  
      console.log('Challenge creation response:', {
        status: res.status,
        body: res.body
      });
  
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.author).toBe(userId.toString());
    });
  });
