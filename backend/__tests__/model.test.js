const mongoose = require("mongoose");

process.env.NODE_ENV = 'test';
process.env.ACCESS_TOKEN_SECRET = 'none';
process.env.BASE_URL = 'none';

const app = require('../server');
const Item = mongoose.model('Item');
const User = mongoose.model('User');

describe('Model Tests', () => {
    test('Item model exists', () => {
        expect(Item).toBeTruthy();
    });
    test('User model exists', () => {
        expect(User).toBeTruthy();
    });
    test('Item model can be used', () => {
        expect(new Item()).toBeInstanceOf(mongoose.Document);
    });
    test('User model can be used', () => {
        expect(new User()).toBeInstanceOf(mongoose.Document);
    });
    test('Item model requires title', () => {
        var tempError = (new Item()).validateSync().errors['title'];
        expect(tempError).toBeTruthy();
        expect(tempError.kind).toBe('required');
    });
    test('User model requires firstName', () => {
        var tempError = (new User()).validateSync().errors['firstName'];
        expect(tempError).toBeTruthy();
        expect(tempError.kind).toBe('required');
    });
    test('User model requires email', () => {
        var tempError = (new User()).validateSync().errors['email'];
        expect(tempError).toBeTruthy();
        expect(tempError.kind).toBe('required');
    });
    test('User model requires password', () => {
        var tempError = (new User()).validateSync().errors['password'];
        expect(tempError).toBeTruthy();
        expect(tempError.kind).toBe('required');
    });
});