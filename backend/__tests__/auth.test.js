// auth.test.js - Unit tests for authentication endpoints
// Located in: backend/__tests__/auth.test.js
// Run with: npm run test:unit

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server'); // ← ADD THIS!

// Mock SendGrid BEFORE requiring server
jest.mock('@sendgrid/mail', () => ({
    setApiKey: jest.fn(),
    send: jest.fn().mockResolvedValue([{ statusCode: 202 }])
}));

// Set environment to 'test' BEFORE requiring server (CRITICAL!)
process.env.NODE_ENV = 'test'; // ← THIS IS THE KEY FIX!
process.env.ACCESS_TOKEN_SECRET = 'test-secret-key-for-testing';
process.env.BASE_URL = 'http://localhost:4000';
process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
process.env.SENDGRID_FROM_EMAIL = 'test@example.com';

// Now import the server (it will skip DB connection because NODE_ENV=test)
const app = require('../server');

// Get mocked sgMail for verification
const sgMail = require('@sendgrid/mail');

// Get User model from mongoose (defined in server.js)
const User = mongoose.model('User');

// ==================== TEST SETUP ====================

let mongoServer;

// Setup: Connect to in-memory MongoDB before all tests
beforeAll(async () => {
    // Close any existing mongoose connections
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to in-memory database
    await mongoose.connect(mongoUri);

    console.log('✅ Connected to in-memory MongoDB for testing');
}, 60000); // 60 second timeout for setup

// Cleanup: Clear database after each test to ensure isolation
afterEach(async () => {
    // Clear all collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
    // Clear all mocks
    jest.clearAllMocks();
});

// Teardown: Close database connection and stop MongoDB after all tests
afterAll(async () => {
    // Disconnect mongoose
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    // Stop in-memory server
    if (mongoServer) {
        await mongoServer.stop();
    }
    console.log('✅ Closed MongoDB connection and stopped test server');
}, 60000); // 60 second timeout for teardown

// ==================== HELPER FUNCTIONS ====================

// Helper to create a test user in database
const createTestUser = async (userData = {}) => {
    const defaultUser = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: await bcrypt.hash('password123', 10),
        isVerified: true,
        ...userData
    };
    return await User.create(defaultUser);
};

// ==================== REGISTER ENDPOINT TESTS ====================

describe('POST /api/auth/register', () => {

    test('Should successfully register a new user', async () => {
        const newUser = {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            password: 'SecurePass123'
        };

        const response = await request(app)
            .post('/api/auth/register')
            .send(newUser)
            .expect(201);

        // Check response structure
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('userId');
        expect(response.body.error).toBe('');

        // Verify user was created in database
        const user = await User.findById(response.body.userId);
        expect(user).toBeTruthy();
        expect(user.email).toBe('jane@example.com');
        expect(user.firstName).toBe('Jane');
        expect(user.isVerified).toBe(false);

        // Verify password was hashed (not stored as plain text)
        expect(user.password).not.toBe('SecurePass123');
        const isPasswordValid = await bcrypt.compare('SecurePass123', user.password);
        expect(isPasswordValid).toBe(true);

        // Verify verification token was created
        expect(user.verificationToken).toBeTruthy();
        expect(user.verificationTokenExpires).toBeTruthy();

        // Verify email was sent
        expect(sgMail.send).toHaveBeenCalledTimes(1);
        expect(sgMail.send.mock.calls[0][0].to).toBe('jane@example.com');
    });

    test('Should fail when required fields are missing', async () => {
        const incompleteUser = {
            firstName: 'Jane',
            email: 'jane@example.com'
            // Missing lastName and password
        };

        const response = await request(app)
            .post('/api/auth/register')
            .send(incompleteUser)
            .expect(400);

        expect(response.body).toHaveProperty('error', 'All fields required');
    });

    test('Should fail when email already exists', async () => {
        // Create existing user
        await createTestUser({ email: 'existing@example.com' });

        const duplicateUser = {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'existing@example.com',
            password: 'password123'
        };

        const response = await request(app)
            .post('/api/auth/register')
            .send(duplicateUser)
            .expect(400);

        expect(response.body).toHaveProperty('error', 'User already exists');
    });

    test('Should handle email send failure gracefully', async () => {
        // Mock email failure
        sgMail.send.mockRejectedValueOnce(new Error('SendGrid error'));

        const newUser = {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            password: 'SecurePass123'
        };

        const response = await request(app)
            .post('/api/auth/register')
            .send(newUser)
            .expect(201);

        // User should still be created even if email fails
        expect(response.body.success).toBe(true);
        const user = await User.findById(response.body.userId);
        expect(user).toBeTruthy();
    });

    test('Should store email in lowercase', async () => {
        const newUser = {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'Jane@EXAMPLE.COM',
            password: 'SecurePass123'
        };

        const response = await request(app)
            .post('/api/auth/register')
            .send(newUser)
            .expect(201);

        const user = await User.findById(response.body.userId);
        expect(user.email).toBe('jane@example.com');
    });

    test('Should trim whitespace from names', async () => {
        const newUser = {
            firstName: '  Jane  ',
            lastName: '  Smith  ',
            email: 'jane@example.com',
            password: 'SecurePass123'
        };

        const response = await request(app)
            .post('/api/auth/register')
            .send(newUser)
            .expect(201);

        const user = await User.findById(response.body.userId);
        expect(user.firstName).toBe('Jane');
        expect(user.lastName).toBe('Smith');
    });
});

// ==================== LOGIN ENDPOINT TESTS ====================

describe('POST /api/auth/login', () => {

    test('Should successfully login with valid credentials', async () => {
        // Create verified test user
        await createTestUser({
            email: 'john@example.com',
            password: await bcrypt.hash('password123', 10),
            isVerified: true
        });

        const credentials = {
            email: 'john@example.com',
            password: 'password123'
        };

        const response = await request(app)
            .post('/api/auth/login')
            .send(credentials)
            .expect(200);

        // Check response structure
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('userId');
        expect(response.body).toHaveProperty('firstName', 'John');
        expect(response.body).toHaveProperty('lastName', 'Doe');
        expect(response.body.error).toBe('');

        // Verify JWT token is valid
        const decoded = jwt.verify(
            response.body.accessToken,
            process.env.ACCESS_TOKEN_SECRET
        );
        expect(decoded).toHaveProperty('userId');
        expect(decoded).toHaveProperty('email', 'john@example.com');
        expect(decoded).toHaveProperty('firstName', 'John');
    });

    test('Should fail when email is missing', async () => {
        const credentials = {
            password: 'password123'
        };

        const response = await request(app)
            .post('/api/auth/login')
            .send(credentials)
            .expect(400);

        expect(response.body).toHaveProperty('error', 'Email and password required');
    });

    test('Should fail when password is missing', async () => {
        const credentials = {
            email: 'john@example.com'
        };

        const response = await request(app)
            .post('/api/auth/login')
            .send(credentials)
            .expect(400);

        expect(response.body).toHaveProperty('error', 'Email and password required');
    });

    test('Should fail with non-existent email', async () => {
        const credentials = {
            email: 'nonexistent@example.com',
            password: 'password123'
        };

        const response = await request(app)
            .post('/api/auth/login')
            .send(credentials)
            .expect(401);

        expect(response.body).toHaveProperty('error', 'Invalid email or password');
    });

    test('Should fail with incorrect password', async () => {
        await createTestUser({
            email: 'john@example.com',
            password: await bcrypt.hash('correctpassword', 10),
            isVerified: true
        });

        const credentials = {
            email: 'john@example.com',
            password: 'wrongpassword'
        };

        const response = await request(app)
            .post('/api/auth/login')
            .send(credentials)
            .expect(401);

        expect(response.body).toHaveProperty('error', 'Invalid email or password');
    });

    test('Should fail when email is not verified', async () => {
        await createTestUser({
            email: 'unverified@example.com',
            password: await bcrypt.hash('password123', 10),
            isVerified: false
        });

        const credentials = {
            email: 'unverified@example.com',
            password: 'password123'
        };

        const response = await request(app)
            .post('/api/auth/login')
            .send(credentials)
            .expect(403);

        expect(response.body).toHaveProperty('error', 'Please verify your email before logging in');
    });

    test('Should be case-insensitive for email', async () => {
        await createTestUser({
            email: 'john@example.com',
            password: await bcrypt.hash('password123', 10),
            isVerified: true
        });

        const credentials = {
            email: 'JOHN@EXAMPLE.COM',
            password: 'password123'
        };

        const response = await request(app)
            .post('/api/auth/login')
            .send(credentials)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.accessToken).toBeTruthy();
    });

    test('Should return token that expires in 24 hours', async () => {
        await createTestUser({
            email: 'john@example.com',
            password: await bcrypt.hash('password123', 10),
            isVerified: true
        });

        const credentials = {
            email: 'john@example.com',
            password: 'password123'
        };

        const response = await request(app)
            .post('/api/auth/login')
            .send(credentials)
            .expect(200);

        const decoded = jwt.verify(
            response.body.accessToken,
            process.env.ACCESS_TOKEN_SECRET
        );

        // Check token expiration (should be ~24 hours from now)
        const expirationTime = decoded.exp - decoded.iat;
        const expectedExpiration = 24 * 60 * 60; // 24 hours in seconds
        expect(expirationTime).toBe(expectedExpiration);
    });
});

// ==================== INTEGRATION TESTS ====================

describe('Register and Login Flow', () => {

    test('Should register, verify, and login successfully', async () => {
        // Step 1: Register
        const newUser = {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            password: 'SecurePass123'
        };

        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send(newUser)
            .expect(201);

        expect(registerResponse.body.success).toBe(true);
        const userId = registerResponse.body.userId;

        // Step 2: Get verification token from database
        const user = await User.findById(userId);
        const verificationToken = user.verificationToken;

        // Step 3: Verify email
        const verifyResponse = await request(app)
            .get(`/api/auth/verify/${verificationToken}`)
            .expect(200);

        expect(verifyResponse.body.success).toBe(true);

        // Step 4: Login
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'jane@example.com',
                password: 'SecurePass123'
            })
            .expect(200);

        expect(loginResponse.body.success).toBe(true);
        expect(loginResponse.body.accessToken).toBeTruthy();
        expect(loginResponse.body.firstName).toBe('Jane');
    });

    test('Should not allow login before email verification', async () => {
        // Step 1: Register
        const newUser = {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            password: 'SecurePass123'
        };

        await request(app)
            .post('/api/auth/register')
            .send(newUser)
            .expect(201);

        // Step 2: Try to login without verifying
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'jane@example.com',
                password: 'SecurePass123'
            })
            .expect(403);

        expect(loginResponse.body.error).toBe('Please verify your email before logging in');
    });
});