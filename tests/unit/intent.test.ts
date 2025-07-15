const { detectIntent } = require('../../dist/intent/intentDetector');
const { intents } = require('../../dist/intent/config');

describe('Intent Detection Module', () => {
    describe('detectIntent function', () => {
        test('should detect greet intent', () => {
            expect(detectIntent('hello')).toBe('greet');
            expect(detectIntent('hi')).toBe('greet');
        });

        test('should detect loan_inquiry intent', () => {
            expect(detectIntent('I need a loan')).toBe('loan_inquiry');
            expect(detectIntent('Can I borrow money?')).toBe('loan_inquiry');
        });

        test('should detect exit intent', () => {
            expect(detectIntent('bye')).toBe('exit');
            expect(detectIntent('exit')).toBe('exit');
        });

        test('should return unknown for unrecognized input', () => {
            expect(detectIntent('random text')).toBe('unknown');
            expect(detectIntent('')).toBe('unknown');
        });
    });

    describe('intents configuration', () => {
        test('should have intents array', () => {
            expect(Array.isArray(intents)).toBe(true);
            expect(intents.length).toBeGreaterThan(0);
        });

        test('should have greet intent', () => {
            expect(intents.find(i => i.name === 'greet')).toBeDefined();
        });

        test('should have loan_inquiry intent', () => {
            expect(intents.find(i => i.name === 'loan_inquiry')).toBeDefined();
        });

        test('should have exit intent', () => {
            expect(intents.find(i => i.name === 'exit')).toBeDefined();
        });
    });
}); 