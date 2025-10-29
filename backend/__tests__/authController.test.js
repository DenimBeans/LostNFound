import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';
import { register, login } from '../src/controllers/authController.js';

// Mock the User model
jest.mock('../src/models/User.js');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('Authentication Controller Tests', () => {
    let req, res;

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Mock request and response objects
        req = {
            body: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe('POST /register', () => {

        test('should register a new user successfully', async () => {
            // Arrange
            req.body = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                password: 'password123'
            };

            User.findOne.mockResolvedValue(null); // No existing user
            bcrypt.hash.mockResolvedValue('hashedPassword123');
            User.create.mockResolvedValue({
                _id: 'user123',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                isVerified: true
            });

            // Act
            await register(req, res);

            // Assert
            expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(User.create).toHaveBeenCalledWith({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                password: 'hashedPassword123',
                isVerified: true
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'User registered successfully',
                userId: 'user123',
                error: ''
            });
        });

        test('should return 400 if required fields are missing', async () => {
            // Arrange
            req.body = {
                firstName: 'John',
                email: 'john@example.com'
                // Missing lastName and password
            };

            // Act
            await register(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'All fields required' });
            expect(User.findOne).not.toHaveBeenCalled();
        });

        test('should return 400 if user already exists', async () => {
            // Arrange
            req.body = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'existing@example.com',
                password: 'password123'
            };

            User.findOne.mockResolvedValue({ email: 'existing@example.com' });

            // Act
            await register(req, res);

            // Assert
            expect(User.findOne).toHaveBeenCalledWith({ email: 'existing@example.com' });
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'User already exists' });
            expect(bcrypt.hash).not.toHaveBeenCalled();
        });

        test('should return 500 if database error occurs', async () => {
            // Arrange
            req.body = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                password: 'password123'
            };

            User.findOne.mockRejectedValue(new Error('Database connection failed'));

            // Act
            await register(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Database connection failed' });
        });
    });

    describe('POST /login', () => {

        test('should login user successfully with valid credentials', async () => {
            // Arrange
            req.body = {
                email: 'john@example.com',
                password: 'password123'
            };

            const mockUser = {
                _id: 'user123',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                password: 'hashedPassword123'
            };

            User.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('mockAccessToken');

            // Act
            await login(req, res);

            // Assert
            expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
            expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
            expect(jwt.sign).toHaveBeenCalledWith(
                { userId: 'user123', email: 'john@example.com', firstName: 'John' },
                expect.any(String),
                { expiresIn: '24h' }
            );
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                accessToken: 'mockAccessToken',
                userId: 'user123',
                firstName: 'John',
                lastName: 'Doe',
                error: ''
            });
        });

        test('should return 400 if email or password is missing', async () => {
            // Arrange
            req.body = {
                email: 'john@example.com'
                // Missing password
            };

            // Act
            await login(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Email and password required' });
            expect(User.findOne).not.toHaveBeenCalled();
        });

        test('should return 401 if user does not exist', async () => {
            // Arrange
            req.body = {
                email: 'nonexistent@example.com',
                password: 'password123'
            };

            User.findOne.mockResolvedValue(null);

            // Act
            await login(req, res);

            // Assert
            expect(User.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email or password' });
            expect(bcrypt.compare).not.toHaveBeenCalled();
        });

        test('should return 401 if password is incorrect', async () => {
            // Arrange
            req.body = {
                email: 'john@example.com',
                password: 'wrongpassword'
            };

            const mockUser = {
                _id: 'user123',
                email: 'john@example.com',
                password: 'hashedPassword123'
            };

            User.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(false);

            // Act
            await login(req, res);

            // Assert
            expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword123');
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email or password' });
            expect(jwt.sign).not.toHaveBeenCalled();
        });

        test('should return 500 if database error occurs during login', async () => {
            // Arrange
            req.body = {
                email: 'john@example.com',
                password: 'password123'
            };

            User.findOne.mockRejectedValue(new Error('Database error'));

            // Act
            await login(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
        });
    });
});