// hamburgapi.test.js - Unit tests for items, accounts, notifications, and tracked items
// Located in: backend/__tests__/hamburgapi.test.js
// Run with: npm run test:hamburgapi

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock SendGrid BEFORE requiring server
jest.mock('@sendgrid/mail', () => ({
    setApiKey: jest.fn(),
    send: jest.fn().mockResolvedValue([{ statusCode: 202 }])
}));

// Set environment to 'test' BEFORE requiring server
process.env.NODE_ENV = 'test';
process.env.ACCESS_TOKEN_SECRET = 'test-secret-key-for-testing';
process.env.BASE_URL = 'http://localhost:4000';
process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
process.env.SENDGRID_FROM_EMAIL = 'test@example.com';

// Import server
const app = require('../server');

// Get models
const User = mongoose.model('User');
const Item = mongoose.model('Item');
const Notification = mongoose.model('Notification');

// ==================== TEST SETUP ====================

let mongoServer;
let userCounter = 0; // Counter to generate unique emails

beforeAll(async () => {
    // Suppress console.error during tests to reduce noise from expected errors
    jest.spyOn(console, 'error').mockImplementation(() => { });

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to in-memory MongoDB for hamburgapi tests');
}, 60000);

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
    jest.clearAllMocks();
});

afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
    console.log('✅ Closed MongoDB connection');
}, 60000);

// ==================== HELPER FUNCTIONS ====================

const createTestUser = async (userData = {}) => {
    userCounter++;
    const defaultUser = {
        firstName: 'John',
        lastName: 'Doe',
        email: `john${userCounter}@example.com`, // Unique email per user
        password: await bcrypt.hash('password123', 10),
        isVerified: true,
        ...userData
    };
    return await User.create(defaultUser);
};

const createTestItem = async (itemData = {}) => {
    let user = itemData.userId;
    if (!user) {
        user = await createTestUser();
    }
    const defaultItem = {
        title: 'Lost iPhone',
        description: 'Black iPhone 13 Pro',
        category: 'Electronics',
        status: 'lost',
        userId: user._id || user,
        ...itemData
    };
    return await Item.create(defaultItem);
};

const createTestNotification = async (notificationData = {}) => {
    let user = notificationData.userId;
    if (!user) {
        user = await createTestUser();
    }
    const defaultNotification = {
        userId: user._id || user,
        text: 'Test notification',
        isRead: false,
        isMeetup: false,
        ...notificationData
    };
    return await Notification.create(defaultNotification);
};

// ==================== NOTIFICATION TESTS ====================

describe('Notification Endpoints', () => {

    describe('POST /api/notifications - Create Notification', () => {

        test('Should successfully create a regular notification', async () => {
            const user = await createTestUser();

            const notificationData = {
                userId: user._id,
                text: 'Someone is interested in your lost item'
            };

            const response = await request(app)
                .post('/api/notifications')
                .send(notificationData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Notification created successfully');
            expect(response.body.notificationId).toBeDefined();
            expect(response.body.notification.text).toBe('Someone is interested in your lost item');
            expect(response.body.notification.isRead).toBe(false);
            expect(response.body.notification.isMeetup).toBe(false);
        });

        test('Should create notification with sender and item references', async () => {
            const user = await createTestUser();
            const sender = await createTestUser();
            const item = await createTestItem();

            const notificationData = {
                userId: user._id,
                text: 'New message about your item',
                senderId: sender._id,
                itemId: item._id
            };

            const response = await request(app)
                .post('/api/notifications')
                .send(notificationData)
                .expect(201);

            expect(response.body.notification.senderId).toBeDefined();
            expect(response.body.notification.senderId.firstName).toBe('John');
            expect(response.body.notification.itemId).toBeDefined();
            expect(response.body.notification.itemId.title).toBe('Lost iPhone');
        });

        test('Should create meet-up notification with location and time', async () => {
            const user = await createTestUser();
            const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

            const notificationData = {
                userId: user._id,
                text: 'Meet-up scheduled for item return',
                isMeetup: true,
                location: 'UCF Student Union',
                meetTime: futureDate.toISOString()
            };

            const response = await request(app)
                .post('/api/notifications')
                .send(notificationData)
                .expect(201);

            expect(response.body.notification.isMeetup).toBe(true);
            expect(response.body.notification.location).toBe('UCF Student Union');
            expect(response.body.notification.meetTime).toBeDefined();
        });

        test('Should fail without userId', async () => {
            const notificationData = {
                text: 'Test notification'
            };

            const response = await request(app)
                .post('/api/notifications')
                .send(notificationData)
                .expect(400);

            expect(response.body.error).toBe('User ID and notification text are required');
        });

        test('Should fail without text', async () => {
            const user = await createTestUser();

            const notificationData = {
                userId: user._id
            };

            const response = await request(app)
                .post('/api/notifications')
                .send(notificationData)
                .expect(400);

            expect(response.body.error).toBe('User ID and notification text are required');
        });

        test('Should fail with non-existent userId', async () => {
            const fakeUserId = new mongoose.Types.ObjectId();

            const notificationData = {
                userId: fakeUserId,
                text: 'Test notification'
            };

            const response = await request(app)
                .post('/api/notifications')
                .send(notificationData)
                .expect(404);

            expect(response.body.error).toBe('User not found');
        });

        test('Should fail meet-up notification without location', async () => {
            const user = await createTestUser();
            const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

            const notificationData = {
                userId: user._id,
                text: 'Meet-up notification',
                isMeetup: true,
                meetTime: futureDate.toISOString()
            };

            const response = await request(app)
                .post('/api/notifications')
                .send(notificationData)
                .expect(400);

            expect(response.body.error).toBe('Location and meet time are required for meet-up notifications');
        });

        test('Should fail meet-up notification without meetTime', async () => {
            const user = await createTestUser();

            const notificationData = {
                userId: user._id,
                text: 'Meet-up notification',
                isMeetup: true,
                location: 'UCF Student Union'
            };

            const response = await request(app)
                .post('/api/notifications')
                .send(notificationData)
                .expect(400);

            expect(response.body.error).toBe('Location and meet time are required for meet-up notifications');
        });

        test('Should fail meet-up with past meetTime', async () => {
            const user = await createTestUser();
            const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const notificationData = {
                userId: user._id,
                text: 'Meet-up notification',
                isMeetup: true,
                location: 'UCF Student Union',
                meetTime: pastDate.toISOString()
            };

            const response = await request(app)
                .post('/api/notifications')
                .send(notificationData)
                .expect(400);

            expect(response.body.error).toBe('Meet time must be in the future');
        });

        test('Should fail with non-existent senderId', async () => {
            const user = await createTestUser();
            const fakeSenderId = new mongoose.Types.ObjectId();

            const notificationData = {
                userId: user._id,
                text: 'Test notification',
                senderId: fakeSenderId
            };

            const response = await request(app)
                .post('/api/notifications')
                .send(notificationData)
                .expect(404);

            expect(response.body.error).toBe('Sender not found');
        });

        test('Should fail with non-existent itemId', async () => {
            const user = await createTestUser();
            const fakeItemId = new mongoose.Types.ObjectId();

            const notificationData = {
                userId: user._id,
                text: 'Test notification',
                itemId: fakeItemId
            };

            const response = await request(app)
                .post('/api/notifications')
                .send(notificationData)
                .expect(404);

            expect(response.body.error).toBe('Item not found');
        });
    });

    describe('GET /api/users/:userId/notifications - Get User Notifications', () => {

        test('Should retrieve all notifications for a user', async () => {
            const user = await createTestUser();

            await createTestNotification({ userId: user._id, text: 'Notification 1' });
            await createTestNotification({ userId: user._id, text: 'Notification 2' });
            await createTestNotification({ userId: user._id, text: 'Notification 3' });

            const response = await request(app)
                .get(`/api/users/${user._id}/notifications`)
                .expect(200);

            expect(response.body.results).toHaveLength(3);
            expect(response.body.count).toBe(3);
            expect(response.body.unreadCount).toBe(3);
        });

        test('Should return empty array for user with no notifications', async () => {
            const user = await createTestUser();

            const response = await request(app)
                .get(`/api/users/${user._id}/notifications`)
                .expect(200);

            expect(response.body.results).toEqual([]);
            expect(response.body.count).toBe(0);
            expect(response.body.unreadCount).toBe(0);
        });

        test('Should filter by isRead status', async () => {
            const user = await createTestUser();

            await createTestNotification({ userId: user._id, isRead: false });
            await createTestNotification({ userId: user._id, isRead: false });
            await createTestNotification({ userId: user._id, isRead: true });

            const response = await request(app)
                .get(`/api/users/${user._id}/notifications?isRead=false`)
                .expect(200);

            expect(response.body.results).toHaveLength(2);
            expect(response.body.results.every(n => n.isRead === false)).toBe(true);
        });

        test('Should filter by isMeetup', async () => {
            const user = await createTestUser();
            const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

            await createTestNotification({ userId: user._id, isMeetup: false });
            await createTestNotification({
                userId: user._id,
                isMeetup: true,
                location: 'Test Location',
                meetTime: futureDate
            });

            const response = await request(app)
                .get(`/api/users/${user._id}/notifications?isMeetup=true`)
                .expect(200);

            expect(response.body.results).toHaveLength(1);
            expect(response.body.results[0].isMeetup).toBe(true);
        });

        test('Should populate sender information', async () => {
            const user = await createTestUser();
            const sender = await createTestUser({ firstName: 'Jane', lastName: 'Smith' });

            await createTestNotification({
                userId: user._id,
                senderId: sender._id,
                text: 'Message from Jane'
            });

            const response = await request(app)
                .get(`/api/users/${user._id}/notifications`)
                .expect(200);

            expect(response.body.results[0].senderId).toBeDefined();
            expect(response.body.results[0].senderId.firstName).toBe('Jane');
            expect(response.body.results[0].senderId.lastName).toBe('Smith');
        });

        test('Should populate item information', async () => {
            const user = await createTestUser();
            const item = await createTestItem({ title: 'Lost Wallet' });

            await createTestNotification({
                userId: user._id,
                itemId: item._id,
                text: 'Update on your item'
            });

            const response = await request(app)
                .get(`/api/users/${user._id}/notifications`)
                .expect(200);

            expect(response.body.results[0].itemId).toBeDefined();
            expect(response.body.results[0].itemId.title).toBe('Lost Wallet');
        });

        test('Should sort notifications by newest first', async () => {
            const user = await createTestUser();

            await createTestNotification({ userId: user._id, text: 'Old' });
            await new Promise(resolve => setTimeout(resolve, 10));
            await createTestNotification({ userId: user._id, text: 'New' });

            const response = await request(app)
                .get(`/api/users/${user._id}/notifications`)
                .expect(200);

            expect(response.body.results[0].text).toBe('New');
            expect(response.body.results[1].text).toBe('Old');
        });

        test('Should calculate correct unreadCount', async () => {
            const user = await createTestUser();

            await createTestNotification({ userId: user._id, isRead: false });
            await createTestNotification({ userId: user._id, isRead: false });
            await createTestNotification({ userId: user._id, isRead: true });
            await createTestNotification({ userId: user._id, isRead: true });

            const response = await request(app)
                .get(`/api/users/${user._id}/notifications`)
                .expect(200);

            expect(response.body.unreadCount).toBe(2);
            expect(response.body.count).toBe(4);
        });

        test('Should not return other users notifications', async () => {
            const user1 = await createTestUser();
            const user2 = await createTestUser();

            await createTestNotification({ userId: user1._id, text: 'User 1 notification' });
            await createTestNotification({ userId: user2._id, text: 'User 2 notification' });

            const response = await request(app)
                .get(`/api/users/${user1._id}/notifications`)
                .expect(200);

            expect(response.body.results).toHaveLength(1);
            expect(response.body.results[0].text).toBe('User 1 notification');
        });

        test('Should fail with invalid userId format', async () => {
            const response = await request(app)
                .get('/api/users/invalidid123/notifications')
                .expect(400);

            expect(response.body.error).toBe('Invalid user ID format');
        });

        test('Should fail with non-existent userId', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .get(`/api/users/${fakeId}/notifications`)
                .expect(404);

            expect(response.body.error).toBe('User not found');
        });
    });

    describe('GET /api/notifications/:notificationId - Get Specific Notification', () => {

        test('Should retrieve specific notification by ID', async () => {
            const user = await createTestUser();
            const notification = await createTestNotification({
                userId: user._id,
                text: 'Specific notification'
            });

            const response = await request(app)
                .get(`/api/notifications/${notification._id}`)
                .expect(200);

            expect(response.body.notification).toBeDefined();
            expect(response.body.notification.text).toBe('Specific notification');
            expect(response.body.notification._id).toBe(notification._id.toString());
        });

        test('Should populate all references', async () => {
            const user = await createTestUser({ firstName: 'John' });
            const sender = await createTestUser({ firstName: 'Jane' });
            const item = await createTestItem({ title: 'Lost Keys' });

            const notification = await createTestNotification({
                userId: user._id,
                senderId: sender._id,
                itemId: item._id,
                text: 'Complete notification'
            });

            const response = await request(app)
                .get(`/api/notifications/${notification._id}`)
                .expect(200);

            expect(response.body.notification.userId.firstName).toBe('John');
            expect(response.body.notification.senderId.firstName).toBe('Jane');
            expect(response.body.notification.itemId.title).toBe('Lost Keys');
        });

        test('Should fail with non-existent notification ID', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .get(`/api/notifications/${fakeId}`)
                .expect(404);

            expect(response.body.error).toBe('Notification not found');
        });
    });

    describe('PATCH /api/notifications/:notificationId/read - Mark Notification as Read', () => {

        test('Should mark notification as read', async () => {
            const user = await createTestUser();
            const notification = await createTestNotification({
                userId: user._id,
                isRead: false
            });

            const response = await request(app)
                .patch(`/api/notifications/${notification._id}/read`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Notification marked as read');
            expect(response.body.notification.isRead).toBe(true);

            const updated = await Notification.findById(notification._id);
            expect(updated.isRead).toBe(true);
        });

        test('Should handle already read notification', async () => {
            const user = await createTestUser();
            const notification = await createTestNotification({
                userId: user._id,
                isRead: true
            });

            const response = await request(app)
                .patch(`/api/notifications/${notification._id}/read`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.notification.isRead).toBe(true);
        });

        test('Should fail with non-existent notification', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .patch(`/api/notifications/${fakeId}/read`)
                .expect(404);

            expect(response.body.error).toBe('Notification not found');
        });
    });

    describe('PATCH /api/users/:userId/notifications/read-all - Mark All as Read', () => {

        test('Should mark all user notifications as read', async () => {
            const user = await createTestUser();

            await createTestNotification({ userId: user._id, isRead: false });
            await createTestNotification({ userId: user._id, isRead: false });
            await createTestNotification({ userId: user._id, isRead: false });

            const response = await request(app)
                .patch(`/api/users/${user._id}/notifications/read-all`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('All notifications marked as read');
            expect(response.body.modifiedCount).toBe(3);

            const notifications = await Notification.find({ userId: user._id });
            expect(notifications.every(n => n.isRead === true)).toBe(true);
        });

        test('Should only mark unread notifications', async () => {
            const user = await createTestUser();

            await createTestNotification({ userId: user._id, isRead: false });
            await createTestNotification({ userId: user._id, isRead: true });

            const response = await request(app)
                .patch(`/api/users/${user._id}/notifications/read-all`)
                .expect(200);

            expect(response.body.modifiedCount).toBe(1);
        });

        test('Should not affect other users notifications', async () => {
            const user1 = await createTestUser();
            const user2 = await createTestUser();

            await createTestNotification({ userId: user1._id, isRead: false });
            await createTestNotification({ userId: user2._id, isRead: false });

            await request(app)
                .patch(`/api/users/${user1._id}/notifications/read-all`)
                .expect(200);

            const user2Notifications = await Notification.find({ userId: user2._id });
            expect(user2Notifications[0].isRead).toBe(false);
        });

        test('Should succeed even with no unread notifications', async () => {
            const user = await createTestUser();

            await createTestNotification({ userId: user._id, isRead: true });

            const response = await request(app)
                .patch(`/api/users/${user._id}/notifications/read-all`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.modifiedCount).toBe(0);
        });

        test('Should fail with invalid userId format', async () => {
            const response = await request(app)
                .patch('/api/users/invalidid/notifications/read-all')
                .expect(400);

            expect(response.body.error).toBe('Invalid user ID format');
        });
    });

    describe('DELETE /api/notifications/:notificationId - Delete Notification', () => {

        test('Should successfully delete a notification', async () => {
            const user = await createTestUser();
            const notification = await createTestNotification({ userId: user._id });

            const response = await request(app)
                .delete(`/api/notifications/${notification._id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Notification deleted successfully');

            const deleted = await Notification.findById(notification._id);
            expect(deleted).toBeNull();
        });

        test('Should fail with non-existent notification', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .delete(`/api/notifications/${fakeId}`)
                .expect(404);

            expect(response.body.error).toBe('Notification not found');
        });
    });

    describe('DELETE /api/users/:userId/notifications - Delete All User Notifications', () => {

        test('Should delete all notifications for a user', async () => {
            const user = await createTestUser();

            await createTestNotification({ userId: user._id });
            await createTestNotification({ userId: user._id });
            await createTestNotification({ userId: user._id });

            const response = await request(app)
                .delete(`/api/users/${user._id}/notifications`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('All notifications deleted');
            expect(response.body.deletedCount).toBe(3);

            const remaining = await Notification.find({ userId: user._id });
            expect(remaining).toHaveLength(0);
        });

        test('Should not delete other users notifications', async () => {
            const user1 = await createTestUser();
            const user2 = await createTestUser();

            await createTestNotification({ userId: user1._id });
            await createTestNotification({ userId: user2._id });

            await request(app)
                .delete(`/api/users/${user1._id}/notifications`)
                .expect(200);

            const user2Notifications = await Notification.find({ userId: user2._id });
            expect(user2Notifications).toHaveLength(1);
        });

        test('Should succeed with no notifications to delete', async () => {
            const user = await createTestUser();

            const response = await request(app)
                .delete(`/api/users/${user._id}/notifications`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.deletedCount).toBe(0);
        });

        test('Should fail with invalid userId format', async () => {
            const response = await request(app)
                .delete('/api/users/invalidid/notifications')
                .expect(400);

            expect(response.body.error).toBe('Invalid user ID format');
        });
    });

    describe('Notification Integration Tests', () => {

        test('Should create, read, and delete notification workflow', async () => {
            const user = await createTestUser();
            const sender = await createTestUser();
            const item = await createTestItem();

            const createResponse = await request(app)
                .post('/api/notifications')
                .send({
                    userId: user._id,
                    senderId: sender._id,
                    itemId: item._id,
                    text: 'Someone wants to return your item'
                })
                .expect(201);

            const notificationId = createResponse.body.notificationId;

            const getResponse = await request(app)
                .get(`/api/users/${user._id}/notifications`)
                .expect(200);

            expect(getResponse.body.unreadCount).toBe(1);

            await request(app)
                .patch(`/api/notifications/${notificationId}/read`)
                .expect(200);

            const afterReadResponse = await request(app)
                .get(`/api/users/${user._id}/notifications`)
                .expect(200);

            expect(afterReadResponse.body.unreadCount).toBe(0);

            await request(app)
                .delete(`/api/notifications/${notificationId}`)
                .expect(200);

            const finalResponse = await request(app)
                .get(`/api/users/${user._id}/notifications`)
                .expect(200);

            expect(finalResponse.body.count).toBe(0);
        });

        test('Should handle multiple meet-up notifications', async () => {
            const user = await createTestUser();
            const futureDate1 = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const futureDate2 = new Date(Date.now() + 48 * 60 * 60 * 1000);

            await request(app)
                .post('/api/notifications')
                .send({
                    userId: user._id,
                    text: 'Meet-up 1',
                    isMeetup: true,
                    location: 'Location 1',
                    meetTime: futureDate1.toISOString()
                })
                .expect(201);

            await request(app)
                .post('/api/notifications')
                .send({
                    userId: user._id,
                    text: 'Meet-up 2',
                    isMeetup: true,
                    location: 'Location 2',
                    meetTime: futureDate2.toISOString()
                })
                .expect(201);

            const response = await request(app)
                .get(`/api/users/${user._id}/notifications?isMeetup=true`)
                .expect(200);

            expect(response.body.count).toBe(2);
            expect(response.body.results.every(n => n.isMeetup === true)).toBe(true);
        });

        test('Should filter and mark multiple notifications', async () => {
            const user = await createTestUser();

            await createTestNotification({ userId: user._id, isRead: false, text: 'Unread 1' });
            await createTestNotification({ userId: user._id, isRead: false, text: 'Unread 2' });
            await createTestNotification({ userId: user._id, isRead: true, text: 'Read 1' });

            const unreadResponse = await request(app)
                .get(`/api/users/${user._id}/notifications?isRead=false`)
                .expect(200);

            expect(unreadResponse.body.count).toBe(2);

            await request(app)
                .patch(`/api/users/${user._id}/notifications/read-all`)
                .expect(200);

            const allResponse = await request(app)
                .get(`/api/users/${user._id}/notifications`)
                .expect(200);

            expect(allResponse.body.unreadCount).toBe(0);
            expect(allResponse.body.results.every(n => n.isRead === true)).toBe(true);
        });
    });
});

// ==================== ACCOUNT MANAGEMENT TESTS ====================

describe('Account Management Endpoints', () => {

    describe('PATCH /api/users/:userId', () => {

        test('Should update firstName', async () => {
            const user = await createTestUser();

            const response = await request(app)
                .patch(`/api/users/${user._id}`)
                .send({ firstName: 'Jane' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.user.firstName).toBe('Jane');
        });

        test('Should update lastName', async () => {
            const user = await createTestUser();

            const response = await request(app)
                .patch(`/api/users/${user._id}`)
                .send({ lastName: 'Smith' })
                .expect(200);

            expect(response.body.user.lastName).toBe('Smith');
        });

        test('Should trim whitespace from names', async () => {
            const user = await createTestUser();

            const response = await request(app)
                .patch(`/api/users/${user._id}`)
                .send({ firstName: '  Jane  ', lastName: '  Smith  ' })
                .expect(200);

            expect(response.body.user.firstName).toBe('Jane');
            expect(response.body.user.lastName).toBe('Smith');
        });

        test('Should update email and require re-verification', async () => {
            const user = await createTestUser({ isVerified: true });

            const response = await request(app)
                .patch(`/api/users/${user._id}`)
                .send({ email: 'newemail@example.com' })
                .expect(200);

            expect(response.body.user.email).toBe('newemail@example.com');
            expect(response.body.user.isVerified).toBe(false);
            expect(response.body.message).toContain('Account updated');
        });

        test('Should fail with duplicate email', async () => {
            const user1 = await createTestUser();
            const user1Email = user1.email; // Save the actual email
            const user2 = await createTestUser(); // Different user with different email

            const response = await request(app)
                .patch(`/api/users/${user2._id}`)
                .send({ email: user1Email }) // Try to use user1's email
                .expect(400);

            expect(response.body.error).toBe('Email already in use');
        });

        test('Should update password with correct current password', async () => {
            const user = await createTestUser();

            const response = await request(app)
                .patch(`/api/users/${user._id}`)
                .send({
                    currentPassword: 'password123',
                    newPassword: 'newPassword456'
                })
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify new password works
            const updatedUser = await User.findById(user._id);
            const isValid = await bcrypt.compare('newPassword456', updatedUser.password);
            expect(isValid).toBe(true);
        });

        test('Should fail password change without current password', async () => {
            const user = await createTestUser();

            const response = await request(app)
                .patch(`/api/users/${user._id}`)
                .send({ newPassword: 'newPassword456' })
                .expect(400);

            expect(response.body.error).toBe('Current password required to change password');
        });

        test('Should fail password change with incorrect current password', async () => {
            const user = await createTestUser();

            const response = await request(app)
                .patch(`/api/users/${user._id}`)
                .send({
                    currentPassword: 'wrongpassword',
                    newPassword: 'newPassword456'
                })
                .expect(401);

            expect(response.body.error).toBe('Current password is incorrect');
        });

        test('Should not expose sensitive fields in response', async () => {
            const user = await createTestUser();

            const response = await request(app)
                .patch(`/api/users/${user._id}`)
                .send({ firstName: 'Jane' })
                .expect(200);

            expect(response.body.user.password).toBeUndefined();
            expect(response.body.user.verificationToken).toBeUndefined();
            expect(response.body.user.resetPasswordToken).toBeUndefined();
        });
    });

    describe('DELETE /api/users/:userId', () => {

        test('Should successfully delete user account', async () => {
            const user = await createTestUser();

            const response = await request(app)
                .delete(`/api/users/${user._id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Account deleted successfully');

            // Verify user is deleted
            const deletedUser = await User.findById(user._id);
            expect(deletedUser).toBeNull();
        });

        test('Should delete all items posted by user', async () => {
            const user = await createTestUser();
            const item1 = await createTestItem({ userId: user._id });
            const item2 = await createTestItem({ userId: user._id });

            await request(app)
                .delete(`/api/users/${user._id}`)
                .expect(200);

            // Verify items are deleted
            const remainingItems = await Item.find({ userId: user._id });
            expect(remainingItems).toHaveLength(0);
        });

        test('Should remove user from tracked items of other users', async () => {
            const user1 = await createTestUser();
            const user2 = await createTestUser({
                trackedItems: [user1._id]
            });

            await request(app)
                .delete(`/api/users/${user1._id}`)
                .expect(200);

            // Verify user1 removed from user2's tracked items
            const updatedUser2 = await User.findById(user2._id);
            expect(updatedUser2.trackedItems).not.toContain(user1._id);
        });

        test('Should fail with non-existent user', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .delete(`/api/users/${fakeId}`)
                .expect(404);

            expect(response.body.error).toBe('User not found');
        });
    });
});

// ==================== TRACKED ITEMS TESTS ====================

describe('Tracked Items Endpoints', () => {

    describe('GET /api/users/:userId/tracked-items', () => {

        test('Should retrieve all tracked items', async () => {
            const user = await createTestUser();
            const item1 = await createTestItem({ title: 'Item 1' });
            const item2 = await createTestItem({ title: 'Item 2' });

            user.trackedItems.push(item1._id, item2._id);
            await user.save();

            const response = await request(app)
                .get(`/api/users/${user._id}/tracked-items`)
                .expect(200);

            expect(response.body.results).toHaveLength(2);
            expect(response.body.count).toBe(2);
        });

        test('Should populate item details', async () => {
            const user = await createTestUser();
            const item = await createTestItem({ title: 'Test Item' });

            user.trackedItems.push(item._id);
            await user.save();

            const response = await request(app)
                .get(`/api/users/${user._id}/tracked-items`)
                .expect(200);

            expect(response.body.results[0].title).toBe('Test Item');
            expect(response.body.results[0].userId).toBeDefined();
        });

        test('Should return empty array for no tracked items', async () => {
            const user = await createTestUser();

            const response = await request(app)
                .get(`/api/users/${user._id}/tracked-items`)
                .expect(200);

            expect(response.body.results).toEqual([]);
            expect(response.body.count).toBe(0);
        });

        test('Should fail with non-existent user', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .get(`/api/users/${fakeId}/tracked-items`)
                .expect(404);

            expect(response.body.error).toBe('User not found');
        });
    });

    describe('DELETE /api/users/:userId/tracked-items/:itemId', () => {

        test('Should remove item from tracked list', async () => {
            const user = await createTestUser();
            const item = await createTestItem();

            user.trackedItems.push(item._id);
            await user.save();

            const response = await request(app)
                .delete(`/api/users/${user._id}/tracked-items/${item._id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.trackedItems).not.toContain(item._id);
        });

        test('Should handle removing item not in tracked list', async () => {
            const user = await createTestUser();
            const item = await createTestItem();

            const response = await request(app)
                .delete(`/api/users/${user._id}/tracked-items/${item._id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        test('Should fail with non-existent user', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const item = await createTestItem();

            const response = await request(app)
                .delete(`/api/users/${fakeId}/tracked-items/${item._id}`)
                .expect(404);

            expect(response.body.error).toBe('User not found');
        });
    });
});