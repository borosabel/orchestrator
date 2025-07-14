import {detectIntent} from "../../intentDetector";

test('detects greet', () => {
    expect(detectIntent('hello')).toBe('greet');
});
test('detects loan_inquiry', () => {
    expect(detectIntent('I need a loan')).toBe('loan_inquiry');
});
test('detects unknown', () => {
    expect(detectIntent('foobar')).toBe('unknown');
});