"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const intentDetector_1 = require("../../intentDetector");
test('detects greet', () => {
    expect((0, intentDetector_1.detectIntent)('hello')).toBe('greet');
});
test('detects loan_inquiry', () => {
    expect((0, intentDetector_1.detectIntent)('I need a loan')).toBe('loan_inquiry');
});
test('detects unknown', () => {
    expect((0, intentDetector_1.detectIntent)('foobar')).toBe('unknown');
});
//# sourceMappingURL=intentDetector.test.js.map