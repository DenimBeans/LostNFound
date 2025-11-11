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

// ==================== NOTIFICATION TESTS ====================

describe('Notification Endpoints', () => {

    describe('GET /api/users/:userId/notifications', () => {

        test('Should retrieve all notifications for a user', async () => {
            const user = await createTestUser({
                notifications: ['Notification 1', 'Notification 2', 'Notification 3']
            });

            const response = await request(app)
                .get(`/api/users/${user._id}/notifications`)
                .expect(200);

            expect(response.body.notifications).toHaveLength(3);
            expect(response.body.count).toBe(3);
            expect(response.body.notifications).toContain('Notification 1');
        });

        test('Should return empty array for user with no notifications', async () => {
            const user = await createTestUser();

            const response = await request(app)
                .get(`/api/users/${user._id}/notifications`)
                .expect(200);

            expect(response.body.notifications).toEqual([]);
            expect(response.body.count).toBe(0);
        });

        test('Should fail with invalid userId', async () => {
            const response = await request(app)
                .get('/api/users/invalidid123/notifications')
                .expect(500);

            expect(response.body).toHaveProperty('error');
        });

        test('Should fail with non-existent userId', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .get(`/api/users/${fakeId}/notifications`)
                .expect(404);

            expect(response.body.error).toBe('User not found');
        });
    });

    describe('DELETE /api/users/:userId/notifications/:notificationIndex', () => {

        test('Should delete a specific notification by index', async () => {
            const user = await createTestUser({
                notifications: ['First', 'Second', 'Third']
            });

            const response = await request(app)
                .delete(`/api/users/${user._id}/notifications/1`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.notifications).toHaveLength(2);
            expect(response.body.notifications).not.toContain('Second');
            expect(response.body.notifications).toContain('First');
            expect(response.body.notifications).toContain('Third');
        });

        test('Should delete first notification (index 0)', async () => {
            const user = await createTestUser({
                notifications: ['First', 'Second']
            });

            const response = await request(app)
                .delete(`/api/users/${user._id}/notifications/0`)
                .expect(200);

            expect(response.body.notifications).toEqual(['Second']);
        });

        test('Should fail with invalid index (negative)', async () => {
            const user = await createTestUser({
                notifications: ['Test']
            });

            const response = await request(app)
                .delete(`/api/users/${user._id}/notifications/-1`)
                .expect(400);

            expect(response.body.error).toBe('Invalid notification index');
        });

        test('Should fail with index out of range', async () => {
            const user = await createTestUser({
                notifications: ['Only one']
            });

            const response = await request(app)
                .delete(`/api/users/${user._id}/notifications/5`)
                .expect(404);

            expect(response.body.error).toBe('Notification not found');
        });

        test('Should fail with non-numeric index', async () => {
            const user = await createTestUser({
                notifications: ['Test']
            });

            const response = await request(app)
                .delete(`/api/users/${user._id}/notifications/abc`)
                .expect(400);

            expect(response.body.error).toBe('Invalid notification index');
        });
    });

    describe('DELETE /api/users/:userId/notifications', () => {

        test('Should clear all notifications', async () => {
            const user = await createTestUser({
                notifications: ['One', 'Two', 'Three', 'Four']
            });

            const response = await request(app)
                .delete(`/api/users/${user._id}/notifications`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('All notifications cleared');

            // Verify in database
            const updatedUser = await User.findById(user._id);
            expect(updatedUser.notifications).toEqual([]);
        });

        test('Should succeed even with no notifications', async () => {
            const user = await createTestUser();

            const response = await request(app)
                .delete(`/api/users/${user._id}/notifications`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });
});

// ==================== ITEM MANAGEMENT TESTS ====================

describe('Item Management Endpoints', () => {

    describe('PATCH /api/items/:id', () => {

        test('Should successfully update item title', async () => {
            const item = await createTestItem();

            const response = await request(app)
                .patch(`/api/items/${item._id}`)
                .send({ title: 'Updated Title' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.item.title).toBe('Updated Title');
            expect(response.body.message).toBe('Item updated successfully');
        });

        test('Should update multiple fields at once', async () => {
            const item = await createTestItem();

            const updates = {
                title: 'New Title',
                description: 'New Description',
                category: 'Books'
            };

            const response = await request(app)
                .patch(`/api/items/${item._id}`)
                .send(updates)
                .expect(200);

            expect(response.body.item.title).toBe('New Title');
            expect(response.body.item.description).toBe('New Description');
            expect(response.body.item.category).toBe('Books');
        });

        test('Should not allow changing userId', async () => {
            const user1 = await createTestUser();
            const user2 = await createTestUser();
            const item = await createTestItem({ userId: user1._id });

            await request(app)
                .patch(`/api/items/${item._id}`)
                .send({ userId: user2._id })
                .expect(200);

            // Verify userId didn't change
            const updatedItem = await Item.findById(item._id);
            expect(updatedItem.userId.toString()).toBe(user1._id.toString());
        });

        test('Should fail with non-existent item', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .patch(`/api/items/${fakeId}`)
                .send({ title: 'Test' })
                .expect(404);

            expect(response.body.error).toBe('Item not found');
        });

        test('Should populate user info in response', async () => {
            const user = await createTestUser();
            const item = await createTestItem({ userId: user._id });

            const response = await request(app)
                .patch(`/api/items/${item._id}`)
                .send({ title: 'Updated' })
                .expect(200);

            expect(response.body.item.userId).toBeDefined();
            expect(response.body.item.userId.firstName).toBe('John');
        });
    });

    describe('DELETE /api/items/:id', () => {

        test('Should successfully delete an item', async () => {
            const item = await createTestItem();

            const response = await request(app)
                .delete(`/api/items/${item._id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Item deleted successfully');

            // Verify item is deleted
            const deletedItem = await Item.findById(item._id);
            expect(deletedItem).toBeNull();
        });

        test('Should fail with non-existent item', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .delete(`/api/items/${fakeId}`)
                .expect(404);

            expect(response.body.error).toBe('Item not found');
        });

        test('Should fail with invalid item ID', async () => {
            const response = await request(app)
                .delete('/api/items/invalid123')
                .expect(500);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('PATCH /api/items/:id/status', () => {

        test('Should update item status to found', async () => {
            const item = await createTestItem({ status: 'lost' });

            const response = await request(app)
                .patch(`/api/items/${item._id}/status`)
                .send({ status: 'found' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.item.status).toBe('found');
        });

        test('Should update status to pending', async () => {
            const item = await createTestItem({ status: 'lost' });

            const response = await request(app)
                .patch(`/api/items/${item._id}/status`)
                .send({ status: 'pending' })
                .expect(200);

            expect(response.body.item.status).toBe('pending');
        });

        test('Should update status to claimed', async () => {
            const item = await createTestItem({ status: 'found' });

            const response = await request(app)
                .patch(`/api/items/${item._id}/status`)
                .send({ status: 'claimed' })
                .expect(200);

            expect(response.body.item.status).toBe('claimed');
        });

        test('Should update status to returned', async () => {
            const item = await createTestItem({ status: 'claimed' });

            const response = await request(app)
                .patch(`/api/items/${item._id}/status`)
                .send({ status: 'returned' })
                .expect(200);

            expect(response.body.item.status).toBe('returned');
        });

        test('Should update status back to lost', async () => {
            const item = await createTestItem({ status: 'found' });

            const response = await request(app)
                .patch(`/api/items/${item._id}/status`)
                .send({ status: 'lost' })
                .expect(200);

            expect(response.body.item.status).toBe('lost');
        });

        test('Should fail with invalid status', async () => {
            const item = await createTestItem();

            const response = await request(app)
                .patch(`/api/items/${item._id}/status`)
                .send({ status: 'invalid_status' })
                .expect(400);

            expect(response.body.error).toContain('Invalid status');
        });

        test('Should fail with missing status', async () => {
            const item = await createTestItem();

            const response = await request(app)
                .patch(`/api/items/${item._id}/status`)
                .send({})
                .expect(400);

            expect(response.body.error).toContain('Invalid status');
        });

        test('Should fail with non-existent item', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .patch(`/api/items/${fakeId}/status`)
                .send({ status: 'found' })
                .expect(404);

            expect(response.body.error).toBe('Item not found');
        });
    });

    describe('GET /api/users/:userId/items', () => {

        test('Should retrieve all items posted by user', async () => {
            const user = await createTestUser();
            await createTestItem({ userId: user._id, title: 'Item 1' });
            await createTestItem({ userId: user._id, title: 'Item 2' });
            await createTestItem({ userId: user._id, title: 'Item 3' });

            const response = await request(app)
                .get(`/api/users/${user._id}/items`)
                .expect(200);

            expect(response.body.results).toHaveLength(3);
            expect(response.body.count).toBe(3);
        });

        test('Should not return items from other users', async () => {
            const user1 = await createTestUser();
            const user2 = await createTestUser();

            await createTestItem({ userId: user1._id, title: 'User 1 Item' });
            await createTestItem({ userId: user2._id, title: 'User 2 Item' });

            const response = await request(app)
                .get(`/api/users/${user1._id}/items`)
                .expect(200);

            expect(response.body.results).toHaveLength(1);
            expect(response.body.results[0].title).toBe('User 1 Item');
        });

        test('Should filter by status', async () => {
            const user = await createTestUser();
            await createTestItem({ userId: user._id, status: 'lost' });
            await createTestItem({ userId: user._id, status: 'found' });
            await createTestItem({ userId: user._id, status: 'lost' });

            const response = await request(app)
                .get(`/api/users/${user._id}/items?status=lost`)
                .expect(200);

            expect(response.body.results).toHaveLength(2);
            expect(response.body.results.every(item => item.status === 'lost')).toBe(true);
        });

        test('Should return empty array for user with no items', async () => {
            const user = await createTestUser();

            const response = await request(app)
                .get(`/api/users/${user._id}/items`)
                .expect(200);

            expect(response.body.results).toEqual([]);
            expect(response.body.count).toBe(0);
        });

        test('Should fail with non-existent user', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .get(`/api/users/${fakeId}/items`)
                .expect(404);

            expect(response.body.error).toBe('User not found');
        });

        test('Should sort items by newest first', async () => {
            const user = await createTestUser();

            const item1 = await createTestItem({
                userId: user._id,
                title: 'Old Item'
            });

            // Wait a bit to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 10));

            const item2 = await createTestItem({
                userId: user._id,
                title: 'New Item'
            });

            const response = await request(app)
                .get(`/api/users/${user._id}/items`)
                .expect(200);

            expect(response.body.results[0].title).toBe('New Item');
            expect(response.body.results[1].title).toBe('Old Item');
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