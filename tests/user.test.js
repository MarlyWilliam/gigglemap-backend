const request = require('supertest');
const express = require('express');
const userRoutes = require('../src/routes/user.routes.js');
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

// Create test app
const app = express();
app.use(express.json());
app.use('/users', userRoutes);

// Test data
let testUser = null;
let testToken = null;
let testUserId = null;
let secondUser = null;
let secondToken = null;
let secondUserId = null;

describe('Users API', () => {
  // Clean up database before and after tests
  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'test@example.com' },
          { email: 'test2@example.com' },
          { username: 'testuser' },
          { username: 'testuser2' }
        ]
      }
    });
  });

  afterAll(async () => {
    // Clean up test data and disconnect
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'test@example.com' },
          { email: 'test2@example.com' },
          { username: 'testuser' },
          { username: 'testuser2' }
        ]
      }
    });
    await prisma.$disconnect();
  });

  describe('User Registration', () => {
    it('POST /users/register should create a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User'
      };

      const res = await request(app)
        .post('/users/register')
        .send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('User created successfully');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.username).toBe('testuser');
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user.fullName).toBe('Test User');
      expect(res.body.user).not.toHaveProperty('password');

      testUserId = res.body.user.id;
      testUser = res.body.user;
    });

    it('POST /users/register should reject duplicate username', async () => {
      const userData = {
        username: 'testuser', // Same username
        email: 'different@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/users/register')
        .send(userData);

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toContain('already exists');
    });

    it('POST /users/register should reject duplicate email', async () => {
      const userData = {
        username: 'differentuser',
        email: 'test@example.com', // Same email
        password: 'password123'
      };

      const res = await request(app)
        .post('/users/register')
        .send(userData);

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toContain('already exists');
    });

    it('POST /users/register should reject short password', async () => {
      const userData = {
        username: 'testuser3',
        email: 'test3@example.com',
        password: '123' // Too short
      };

      const res = await request(app)
        .post('/users/register')
        .send(userData);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('6 characters');
    });

    it('POST /users/register should reject missing fields', async () => {
      const userData = {
        username: 'testuser4'
        // Missing email and password
      };

      const res = await request(app)
        .post('/users/register')
        .send(userData);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('POST /users/register should create a second user for other tests', async () => {
      const userData = {
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'password123',
        fullName: 'Test User 2'
      };

      const res = await request(app)
        .post('/users/register')
        .send(userData);

      expect(res.statusCode).toBe(201);
      secondUserId = res.body.user.id;
      secondUser = res.body.user;
    });
  });

  describe('User Authentication', () => {
    it('POST /users/login should authenticate with email', async () => {
      const loginData = {
        emailOrUsername: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Login successful');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).not.toHaveProperty('password');

      testToken = res.body.token;
      testUser = res.body.user;
    });

    it('POST /users/login should authenticate with username', async () => {
      const loginData = {
        emailOrUsername: 'testuser',
        password: 'password123'
      };

      const res = await request(app)
        .post('/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Login successful');
      expect(res.body).toHaveProperty('token');
    });

    it('POST /users/login should authenticate second user', async () => {
      const loginData = {
        emailOrUsername: 'test2@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(200);
      secondToken = res.body.token;
    });

    it('POST /users/login should reject invalid credentials', async () => {
      const loginData = {
        emailOrUsername: 'test@example.com',
        password: 'wrongpassword'
      };

      const res = await request(app)
        .post('/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toContain('Invalid');
    });

    it('POST /users/login should reject missing fields', async () => {
      const loginData = {
        emailOrUsername: 'test@example.com'
        // Missing password
      };

      const res = await request(app)
        .post('/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('required');
    });
  });

  describe('User Profile Access', () => {
    it('GET /users/me should return current user profile', async () => {
      const res = await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(testUserId);
      expect(res.body.username).toBe('testuser');
      expect(res.body.email).toBe('test@example.com'); // Private info included
      expect(res.body).not.toHaveProperty('password');
    });

    it('GET /users/me should reject unauthorized access', async () => {
      const res = await request(app)
        .get('/users/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toContain('token required');
    });

    it('GET /users/:id should return public profile', async () => {
      const res = await request(app)
        .get(`/users/${testUserId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(testUserId);
      expect(res.body.username).toBe('testuser');
      expect(res.body).not.toHaveProperty('email'); // No private info
      expect(res.body).not.toHaveProperty('password');
    });

    it('GET /users/:id should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/users/99999');

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('GET /users/:id should reject invalid user ID', async () => {
      const res = await request(app)
        .get('/users/invalid');

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Invalid user ID');
    });
  });

  describe('Profile Updates', () => {
    it('PUT /users/:id should update own profile', async () => {
      const updateData = {
        fullName: 'Updated Test User',
        bio: 'This is my test bio',
        website: 'https://example.com',
        city: 'Test City',
        country: 'Test Country',
        instagram: 'testuser_ig',
        twitter: 'testuser_tw',
        latitude: 30.0444,
        longitude: 31.2357
      };

      const res = await request(app)
        .put(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Profile updated successfully');
      expect(res.body.user.fullName).toBe('Updated Test User');
      expect(res.body.user.bio).toBe('This is my test bio');
      expect(res.body.user.website).toBe('https://example.com');
      expect(res.body.user.city).toBe('Test City');
      expect(res.body.user.country).toBe('Test Country');
      expect(res.body.user.instagram).toBe('testuser_ig');
      expect(res.body.user.twitter).toBe('testuser_tw');
    });

    it('PUT /users/:id should reject unauthorized update', async () => {
      const updateData = {
        fullName: 'Hacker Name'
      };

      const res = await request(app)
        .put(`/users/${testUserId}`)
        .send(updateData);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toContain('token required');
    });

    it('PUT /users/:id should reject updating other user profile', async () => {
      const updateData = {
        fullName: 'Hacker Name'
      };

      const res = await request(app)
        .put(`/users/${secondUserId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain('Access denied');
    });
  });

  describe('User Search', () => {
    it('GET /users/search should find users by username', async () => {
      const res = await request(app)
        .get('/users/search?q=testuser');

      expect(res.statusCode).toBe(200);
      expect(res.body.query).toBe('testuser');
      expect(res.body.count).toBeGreaterThan(0);
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users[0]).toHaveProperty('username');
      expect(res.body.users[0]).not.toHaveProperty('email');
    });

    it('GET /users/search should find users by full name', async () => {
      const res = await request(app)
        .get('/users/search?q=Updated Test User');

      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body.users.some(user => user.fullName === 'Updated Test User')).toBe(true);
    });

    it('GET /users/search should limit results', async () => {
      const res = await request(app)
        .get('/users/search?q=test&limit=1');

      expect(res.statusCode).toBe(200);
      expect(res.body.users.length).toBeLessThanOrEqual(1);
    });

    it('GET /users/search should reject short query', async () => {
      const res = await request(app)
        .get('/users/search?q=a');

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('2 characters');
    });

    it('GET /users/search should reject missing query', async () => {
      const res = await request(app)
        .get('/users/search');

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('2 characters');
    });
  });

  describe('Nearby Users', () => {
    it('GET /users/nearby should find nearby users', async () => {
      const res = await request(app)
        .get('/users/nearby?lat=30.044&lng=31.235&radius=5000');

      expect(res.statusCode).toBe(200);
      expect(res.body.center).toEqual({ latitude: 30.044, longitude: 31.235 });
      expect(res.body.radius).toBe(5000);
      expect(Array.isArray(res.body.users)).toBe(true);
      
      if (res.body.users.length > 0) {
        expect(res.body.users[0]).toHaveProperty('distance');
        expect(typeof res.body.users[0].distance).toBe('number');
      }
    });

    it('GET /users/nearby should reject missing coordinates', async () => {
      const res = await request(app)
        .get('/users/nearby?lat=30.044');

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Latitude and longitude are required');
    });

    it('GET /users/nearby should reject invalid coordinates', async () => {
      const res = await request(app)
        .get('/users/nearby?lat=invalid&lng=31.235');

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Invalid latitude or longitude');
    });
  });

  describe('User Engagement', () => {
    it('GET /users/:id/engagement should return engagement stats', async () => {
      const res = await request(app)
        .get(`/users/${testUserId}/engagement`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('username');
      expect(res.body).toHaveProperty('storyCount');
      expect(res.body).toHaveProperty('likeCount');
      expect(res.body).toHaveProperty('commentCount');
      expect(typeof res.body.storyCount).toBe('number');
      expect(typeof res.body.likeCount).toBe('number');
      expect(typeof res.body.commentCount).toBe('number');
    });

    it('PUT /users/:id/stats should update engagement stats', async () => {
      const updateData = {
        statType: 'storyCount',
        increment: 5
      };

      const res = await request(app)
        .put(`/users/${testUserId}/stats`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('User stats updated successfully');
      expect(res.body.user.storyCount).toBe(5);
    });

    it('PUT /users/:id/stats should reject invalid stat type', async () => {
      const updateData = {
        statType: 'invalidStat',
        increment: 1
      };

      const res = await request(app)
        .put(`/users/${testUserId}/stats`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Invalid stat type');
    });

    it('PUT /users/:id/stats should reject unauthorized access', async () => {
      const updateData = {
        statType: 'storyCount',
        increment: 1
      };

      const res = await request(app)
        .put(`/users/${testUserId}/stats`)
        .send(updateData);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toContain('token required');
    });
  });

  describe('Avatar Upload', () => {
    it('POST /users/:id/avatar should reject unauthorized access', async () => {
      const res = await request(app)
        .post(`/users/${testUserId}/avatar`);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toContain('token required');
    });

    it('POST /users/:id/avatar should reject missing file', async () => {
      const res = await request(app)
        .post(`/users/${testUserId}/avatar`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('No image file provided');
    });

    // Note: Testing actual file upload would require mocking Cloudinary
    // and creating actual file buffers, which is complex for this basic test
  });

  describe('User Deletion', () => {
    it('DELETE /users/:id should reject unauthorized access', async () => {
      const res = await request(app)
        .delete(`/users/${testUserId}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toContain('token required');
    });

    it('DELETE /users/:id should reject deleting other user', async () => {
      const res = await request(app)
        .delete(`/users/${secondUserId}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain('Access denied');
    });

    it('DELETE /users/:id should delete own account', async () => {
      const res = await request(app)
        .delete(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('User account deleted successfully');

      // Verify user is deleted
      const getRes = await request(app)
        .get(`/users/${testUserId}`);

      expect(getRes.statusCode).toBe(404);
    });
  });
}); 