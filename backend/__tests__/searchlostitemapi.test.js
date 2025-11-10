// searchlostitemapi.test.js - Unit tests for search and track item endpoints
// Located in: backend/__tests__/searchlostitemapi.test.js
// Run with: npm run test:searchtrack

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
let userCounter = 0;

beforeAll(async () => {
    // Suppress console.error during tests
    jest.spyOn(console, 'error').mockImplementation(() => { });

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to in-memory MongoDB for search/track tests');
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
    console.error.mockRestore();
    console.log('✅ Closed MongoDB connection');
}, 60000);

// ==================== HELPER FUNCTIONS ====================

const createTestUser = async (userData = {}) => {
    userCounter++;
    const defaultUser = {
        firstName: 'John',
        lastName: 'Doe',
        email: `john${userCounter}@example.com`,
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
        location: {
            type: 'Point',
            coordinates: []
        },
        ...itemData
    };
    return await Item.create(defaultItem);
};

// ==================== GET NEARBY ITEMS TESTS ====================

describe('GET /api/items/nearby - Search Items by Location', () => {

    describe('Success Cases', () => {

        test('Should find items within radius', async () => {
            const user = await createTestUser();

            // Create items at different locations
            // UCF location: 28.6024° N, 81.2003° W
            await createTestItem({
                userId: user._id,
                title: 'Item at UCF',
                location: {
                    type: 'Point',
                    coordinates: [-81.2003, 28.6024] // [lng, lat]
                }
            });

            // Item ~1km away
            await createTestItem({
                userId: user._id,
                title: 'Item nearby',
                location: {
                    type: 'Point',
                    coordinates: [-81.2100, 28.6050]
                }
            });

            // Item far away (~100km)
            await createTestItem({
                userId: user._id,
                title: 'Item far away',
                location: {
                    type: 'Point',
                    coordinates: [-80.0000, 29.0000]
                }
            });

            const response = await request(app)
                .get('/api/items/nearby')
                .query({
                    lat: 28.6024,
                    lng: -81.2003,
                    radius: 10 // 10km radius
                })
                .expect(200);

            expect(response.body.results).toHaveLength(2);
            expect(response.body.count).toBe(2);
            expect(response.body.radiusKm).toBe(10);
        });

        test('Should return items sorted by distance (closest first)', async () => {
            const user = await createTestUser();

            // Create items at different distances
            await createTestItem({
                userId: user._id,
                title: 'Far Item',
                location: {
                    type: 'Point',
                    coordinates: [-81.2500, 28.6500] // ~5km away
                }
            });

            await createTestItem({
                userId: user._id,
                title: 'Close Item',
                location: {
                    type: 'Point',
                    coordinates: [-81.2010, 28.6025] // ~1km away
                }
            });

            const response = await request(app)
                .get('/api/items/nearby')
                .query({
                    lat: 28.6024,
                    lng: -81.2003,
                    radius: 10
                })
                .expect(200);

            expect(response.body.results[0].title).toBe('Close Item');
            expect(response.body.results[1].title).toBe('Far Item');
            expect(response.body.results[0].distance).toBeLessThan(response.body.results[1].distance);
        });

        test('Should include distance in kilometers for each item', async () => {
            const user = await createTestUser();

            await createTestItem({
                userId: user._id,
                title: 'Test Item',
                location: {
                    type: 'Point',
                    coordinates: [-81.2003, 28.6024]
                }
            });

            const response = await request(app)
                .get('/api/items/nearby')
                .query({
                    lat: 28.6024,
                    lng: -81.2003,
                    radius: 5
                })
                .expect(200);

            expect(response.body.results[0]).toHaveProperty('distance');
            expect(typeof response.body.results[0].distance).toBe('number');
            expect(response.body.results[0].distance).toBeGreaterThanOrEqual(0);
        });

        test('Should use default radius of 5km if not specified', async () => {
            const user = await createTestUser();

            await createTestItem({
                userId: user._id,
                location: {
                    type: 'Point',
                    coordinates: [-81.2003, 28.6024]
                }
            });

            const response = await request(app)
                .get('/api/items/nearby')
                .query({
                    lat: 28.6024,
                    lng: -81.2003
                    // No radius specified
                })
                .expect(200);

            expect(response.body.radiusKm).toBe(5);
        });

        test('Should return empty array when no items in range', async () => {
            const user = await createTestUser();

            // Create item far away
            await createTestItem({
                userId: user._id,
                location: {
                    type: 'Point',
                    coordinates: [-80.0000, 29.0000]
                }
            });

            const response = await request(app)
                .get('/api/items/nearby')
                .query({
                    lat: 28.6024,
                    lng: -81.2003,
                    radius: 1 // 1km - won't find the far item
                })
                .expect(200);

            expect(response.body.results).toEqual([]);
            expect(response.body.count).toBe(0);
        });

        test('Should populate user information for each item', async () => {
            const user = await createTestUser();

            await createTestItem({
                userId: user._id,
                location: {
                    type: 'Point',
                    coordinates: [-81.2003, 28.6024]
                }
            });

            const response = await request(app)
                .get('/api/items/nearby')
                .query({
                    lat: 28.6024,
                    lng: -81.2003,
                    radius: 5
                })
                .expect(200);

            expect(response.body.results[0].userId).toBeDefined();
            expect(response.body.results[0].userId.firstName).toBe('John');
            expect(response.body.results[0].userId.email).toBeDefined();
        });

        test('Should exclude returned and claimed items', async () => {
            const user = await createTestUser();

            await createTestItem({
                userId: user._id,
                title: 'Lost Item',
                status: 'lost',
                location: { type: 'Point', coordinates: [-81.2003, 28.6024] }
            });

            await createTestItem({
                userId: user._id,
                title: 'Returned Item',
                status: 'returned',
                location: { type: 'Point', coordinates: [-81.2003, 28.6024] }
            });

            await createTestItem({
                userId: user._id,
                title: 'Claimed Item',
                status: 'claimed',
                location: { type: 'Point', coordinates: [-81.2003, 28.6024] }
            });

            const response = await request(app)
                .get('/api/items/nearby')
                .query({
                    lat: 28.6024,
                    lng: -81.2003,
                    radius: 5
                })
                .expect(200);

            expect(response.body.count).toBe(1);
            expect(response.body.results[0].title).toBe('Lost Item');
        });

        test('Should handle items without coordinates', async () => {
            const user = await createTestUser();

            // Item with coordinates
            await createTestItem({
                userId: user._id,
                title: 'Item with location',
                location: { type: 'Point', coordinates: [-81.2003, 28.6024] }
            });

            // Item without coordinates
            await createTestItem({
                userId: user._id,
                title: 'Item without location',
                location: { type: 'Point', coordinates: [] }
            });

            const response = await request(app)
                .get('/api/items/nearby')
                .query({
                    lat: 28.6024,
                    lng: -81.2003,
                    radius: 5
                })
                .expect(200);

            // Should only return item with valid coordinates
            expect(response.body.results.length).toBeGreaterThan(0);
            expect(response.body.results.every(item =>
                item.distance !== null || item.location.coordinates.length === 2
            )).toBe(true);
        });

        test('Should limit results to 50 items', async () => {
            const user = await createTestUser();

            // Create 60 items at same location
            for (let i = 0; i < 60; i++) {
                await createTestItem({
                    userId: user._id,
                    title: `Item ${i}`,
                    location: { type: 'Point', coordinates: [-81.2003, 28.6024] }
                });
            }

            const response = await request(app)
                .get('/api/items/nearby')
                .query({
                    lat: 28.6024,
                    lng: -81.2003,
                    radius: 5
                })
                .expect(200);

            expect(response.body.results.length).toBeLessThanOrEqual(50);
        });

        test('Should return search location in response', async () => {
            const response = await request(app)
                .get('/api/items/nearby')
                .query({
                    lat: 28.6024,
                    lng: -81.2003,
                    radius: 5
                })
                .expect(200);

            expect(response.body.searchLocation).toEqual({
                latitude: 28.6024,
                longitude: -81.2003
            });
        });
    });

    describe('Validation & Error Cases', () => {

        test('Should fail without latitude', async () => {
            const response = await request(app)
                .get('/api/items/nearby')
                .query({
                    lng: -81.2003,
                    radius: 5
                })
                .expect(400);

            expect(response.body.error).toBe('Latitude and longitude required');
        });

        test('Should fail without longitude', async () => {
            const response = await request(app)
                .get('/api/items/nearby')
                .query({
                    lat: 28.6024,
                    radius: 5
                })
                .expect(400);

            expect(response.body.error).toBe('Latitude and longitude required');
        });

        test('Should fail with invalid latitude (too high)', async () => {
            const response = await request(app)
                .get('/api/items/nearby')
                .query({
                    lat: 91, // Max is 90
                    lng: -81.2003,
                    radius: 5
                })
                .expect(400);

            expect(response.body.error).toContain('Invalid coordinates');
        });

        test('Should fail with invalid latitude (too low)', async () => {
            const response = await request(app)
                .get('/api/items/nearby')
                .query({
                    lat: -91, // Min is -90
                    lng: -81.2003,
                    radius: 5
                })
                .expect(400);

            expect(response.body.error).toContain('Invalid coordinates');
        });

        test('Should fail with invalid longitude (too high)', async () => {
            const response = await request(app)
                .get('/api/items/nearby')
                .query({
                    lat: 28.6024,
                    lng: 181, // Max is 180
                    radius: 5
                })
                .expect(400);

            expect(response.body.error).toContain('Invalid coordinates');
        });

        test('Should fail with invalid longitude (too low)', async () => {
            const response = await request(app)
                .get('/api/items/nearby')
                .query({
                    lat: 28.6024,
                    lng: -181, // Min is -180
                    radius: 5
                })
                .expect(400);

            expect(response.body.error).toContain('Invalid coordinates');
        });

        test('Should handle non-numeric latitude', async () => {
            const response = await request(app)
                .get('/api/items/nearby')
                .query({
                    lat: 'invalid',
                    lng: -81.2003,
                    radius: 5
                })
                .expect(500);

            expect(response.body).toHaveProperty('error');
        });

        test('Should handle non-numeric longitude', async () => {
            const response = await request(app)
                .get('/api/items/nearby')
                .query({
                    lat: 28.6024,
                    lng: 'invalid',
                    radius: 5
                })
                .expect(500);

            expect(response.body).toHaveProperty('error');
        });
    });
});

// ==================== TRACK ITEM TESTS ====================

describe('POST /api/users/:userId/tracked-items/:itemId - Track Item', () => {

    describe('Success Cases', () => {

        test('Should successfully add item to tracked list', async () => {
            const user = await createTestUser();
            const item = await createTestItem();

            const response = await request(app)
                .post(`/api/users/${user._id}/tracked-items/${item._id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Item added to tracked list');
            expect(response.body.trackedItems).toContain(item._id.toString());
        });

        test('Should persist tracked item in database', async () => {
            const user = await createTestUser();
            const item = await createTestItem();

            await request(app)
                .post(`/api/users/${user._id}/tracked-items/${item._id}`)
                .expect(200);

            // Verify in database
            const updatedUser = await User.findById(user._id);
            expect(updatedUser.trackedItems).toHaveLength(1);
            expect(updatedUser.trackedItems[0].toString()).toBe(item._id.toString());
        });

        test('Should track multiple items', async () => {
            const user = await createTestUser();
            const item1 = await createTestItem({ title: 'Item 1' });
            const item2 = await createTestItem({ title: 'Item 2' });
            const item3 = await createTestItem({ title: 'Item 3' });

            await request(app)
                .post(`/api/users/${user._id}/tracked-items/${item1._id}`)
                .expect(200);

            await request(app)
                .post(`/api/users/${user._id}/tracked-items/${item2._id}`)
                .expect(200);

            const response = await request(app)
                .post(`/api/users/${user._id}/tracked-items/${item3._id}`)
                .expect(200);

            expect(response.body.trackedItems).toHaveLength(3);
        });

        test('Should track items from different users', async () => {
            const user = await createTestUser();
            const otherUser = await createTestUser();
            const item = await createTestItem({ userId: otherUser._id });

            const response = await request(app)
                .post(`/api/users/${user._id}/tracked-items/${item._id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.trackedItems).toContain(item._id.toString());
        });

        test('Should return updated trackedItems array', async () => {
            const user = await createTestUser();
            const item1 = await createTestItem();
            const item2 = await createTestItem();

            await request(app)
                .post(`/api/users/${user._id}/tracked-items/${item1._id}`)
                .expect(200);

            const response = await request(app)
                .post(`/api/users/${user._id}/tracked-items/${item2._id}`)
                .expect(200);

            expect(response.body.trackedItems).toHaveLength(2);
            expect(response.body.trackedItems).toContain(item1._id.toString());
            expect(response.body.trackedItems).toContain(item2._id.toString());
        });
    });

    describe('Validation & Error Cases', () => {

        test('Should fail with non-existent user', async () => {
            const fakeUserId = new mongoose.Types.ObjectId();
            const item = await createTestItem();

            const response = await request(app)
                .post(`/api/users/${fakeUserId}/tracked-items/${item._id}`)
                .expect(404);

            expect(response.body.error).toBe('User not found');
        });

        test('Should fail with non-existent item', async () => {
            const user = await createTestUser();
            const fakeItemId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .post(`/api/users/${user._id}/tracked-items/${fakeItemId}`)
                .expect(404);

            expect(response.body.error).toBe('Item not found');
        });

        test('Should fail with invalid user ID format', async () => {
            const item = await createTestItem();

            const response = await request(app)
                .post(`/api/users/invalidid123/tracked-items/${item._id}`)
                .expect(500);

            expect(response.body).toHaveProperty('error');
        });

        test('Should fail with invalid item ID format', async () => {
            const user = await createTestUser();

            const response = await request(app)
                .post(`/api/users/${user._id}/tracked-items/invalidid123`)
                .expect(500);

            expect(response.body).toHaveProperty('error');
        });

        test('Should fail when item already tracked', async () => {
            const user = await createTestUser();
            const item = await createTestItem();

            // Track item first time
            await request(app)
                .post(`/api/users/${user._id}/tracked-items/${item._id}`)
                .expect(200);

            // Try to track same item again
            const response = await request(app)
                .post(`/api/users/${user._id}/tracked-items/${item._id}`)
                .expect(400);

            expect(response.body.error).toBe('Item already tracked');
        });

        test('Should not create duplicate tracking entries', async () => {
            const user = await createTestUser();
            const item = await createTestItem();

            // Track item
            await request(app)
                .post(`/api/users/${user._id}/tracked-items/${item._id}`)
                .expect(200);

            // Try to track again (should fail)
            await request(app)
                .post(`/api/users/${user._id}/tracked-items/${item._id}`)
                .expect(400);

            // Verify only one entry in database
            const updatedUser = await User.findById(user._id);
            expect(updatedUser.trackedItems).toHaveLength(1);
        });
    });
});

// ==================== INTEGRATION TESTS ====================

describe('Search and Track Integration', () => {

    test('Should search for items and track them', async () => {
        const user = await createTestUser();

        // Create items at UCF
        const item1 = await createTestItem({
            title: 'Lost Laptop',
            location: { type: 'Point', coordinates: [-81.2003, 28.6024] }
        });

        const item2 = await createTestItem({
            title: 'Lost Keys',
            location: { type: 'Point', coordinates: [-81.2010, 28.6025] }
        });

        // Search for items
        const searchResponse = await request(app)
            .get('/api/items/nearby')
            .query({
                lat: 28.6024,
                lng: -81.2003,
                radius: 5
            })
            .expect(200);

        expect(searchResponse.body.count).toBe(2);

        // Track first item found
        const itemToTrack = searchResponse.body.results[0];
        const trackResponse = await request(app)
            .post(`/api/users/${user._id}/tracked-items/${itemToTrack._id}`)
            .expect(200);

        expect(trackResponse.body.success).toBe(true);
        expect(trackResponse.body.trackedItems).toContain(itemToTrack._id);
    });

    test('Should search multiple locations and track items from different areas', async () => {
        const user = await createTestUser();

        // Create items in Orlando
        const orlandoItem = await createTestItem({
            title: 'Orlando Item',
            location: { type: 'Point', coordinates: [-81.3792, 28.5383] }
        });

        // Create items in Tampa
        const tampaItem = await createTestItem({
            title: 'Tampa Item',
            location: { type: 'Point', coordinates: [-82.4572, 27.9506] }
        });

        // Search Orlando
        const orlandoSearch = await request(app)
            .get('/api/items/nearby')
            .query({ lat: 28.5383, lng: -81.3792, radius: 10 })
            .expect(200);

        // Search Tampa
        const tampaSearch = await request(app)
            .get('/api/items/nearby')
            .query({ lat: 27.9506, lng: -82.4572, radius: 10 })
            .expect(200);

        // Track item from each location
        await request(app)
            .post(`/api/users/${user._id}/tracked-items/${orlandoItem._id}`)
            .expect(200);

        const trackResponse = await request(app)
            .post(`/api/users/${user._id}/tracked-items/${tampaItem._id}`)
            .expect(200);

        expect(trackResponse.body.trackedItems).toHaveLength(2);
    });

    test('Should not find claimed/returned items in search but can still track them if referenced', async () => {
        const user = await createTestUser();

        const claimedItem = await createTestItem({
            title: 'Claimed Item',
            status: 'claimed',
            location: { type: 'Point', coordinates: [-81.2003, 28.6024] }
        });

        // Search should not return claimed item
        const searchResponse = await request(app)
            .get('/api/items/nearby')
            .query({ lat: 28.6024, lng: -81.2003, radius: 5 })
            .expect(200);

        expect(searchResponse.body.count).toBe(0);

        // But can still track it if you have the ID
        const trackResponse = await request(app)
            .post(`/api/users/${user._id}/tracked-items/${claimedItem._id}`)
            .expect(200);

        expect(trackResponse.body.success).toBe(true);
    });
});