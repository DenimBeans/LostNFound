const request = require('supertest');

// Test against your actual server
const API_URL = 'http://localhost:4000';

describe('Lost & Found API Tests', () => {
  
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(API_URL).get('/health');
      expect(response.status).toBe(200);
    });
  });
  
  describe('GET /api/items', () => {
    it('should return items list', async () => {
      const response = await request(API_URL).get('/api/items');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });
  });
  
  describe('POST /api/auth/register', () => {
    it('should reject registration with missing fields', async () => {
      const response = await request(API_URL)
        .post('/api/auth/register')
        .send({
          firstName: 'Test'
          // Missing required fields
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should register with valid data', async () => {
      const uniqueEmail = `test${Date.now()}@test.com`;
      
      const response = await request(API_URL)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: uniqueEmail,
          password: 'Test123456'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('userId');
    });
  });
  
  describe('POST /api/items', () => {
    it('should reject item without required fields', async () => {
      const response = await request(API_URL)
        .post('/api/items')
        .send({
          description: 'Missing title'
        });
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('GET /api/items/nearby', () => {
    it('should require lat and lng', async () => {
      const response = await request(API_URL)
        .get('/api/items/nearby')
        .query({ radius: 5 });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should return nearby items with valid coordinates', async () => {
      const response = await request(API_URL)
        .get('/api/items/nearby')
        .query({
          lat: 28.6024,
          lng: -81.2003,
          radius: 10
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('radiusKm', 10);
    });
  });
  
  describe('POST /api/auth/forgot-password', () => {
    it('should accept valid email format', async () => {
      const response = await request(API_URL)
        .post('/api/auth/forgot-password')
        .send({
          email: 'test@example.com'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });
  });
});
