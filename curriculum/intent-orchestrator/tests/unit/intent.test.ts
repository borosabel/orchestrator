describe('Intent Detection Module', () => {
    const { detectIntent } = require('../../dist/intent/intentDetector');
    
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
