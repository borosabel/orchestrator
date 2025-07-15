import { detectIntent, detectIntentSync } from '../../src/intent/intentDetector';

describe('Intent Detection Module', () => {
    describe('detectIntent function (async LangChain)', () => {
        test('should detect greet intent', async () => {
            expect(await detectIntent('hello')).toBe('greet');
            expect(await detectIntent('hi')).toBe('greet');
        }, 15000);

        test('should detect loan_inquiry intent', async () => {
            expect(await detectIntent('I need a loan')).toBe('loan_inquiry');
            expect(await detectIntent('Can I borrow money?')).toBe('loan_inquiry');
        }, 15000);

        test('should detect exit intent', async () => {
            expect(await detectIntent('bye')).toBe('exit');
            expect(await detectIntent('exit')).toBe('exit');
        }, 15000);

        test('should return unknown for unrecognized input', async () => {
            expect(await detectIntent('random text')).toBe('unknown');
            expect(await detectIntent('')).toBe('unknown');
        }, 15000);
    });

    describe('detectIntentSync function (regex fallback)', () => {
        test('should detect greet intent', () => {
            expect(detectIntentSync('hello')).toBe('greet');
            expect(detectIntentSync('hi')).toBe('greet');
        });

        test('should detect loan_inquiry intent', () => {
            expect(detectIntentSync('I need a loan')).toBe('loan_inquiry');
            expect(detectIntentSync('Can I borrow money?')).toBe('loan_inquiry');
        });

        test('should detect exit intent', () => {
            expect(detectIntentSync('bye')).toBe('exit');
            expect(detectIntentSync('exit')).toBe('exit');
        });

        test('should return unknown for unrecognized input', () => {
            expect(detectIntentSync('random text')).toBe('unknown');
            expect(detectIntentSync('')).toBe('unknown');
        });
    });
});
