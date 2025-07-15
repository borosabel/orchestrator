import { detectIntentWithLangChain } from '../../src/intent/langchainDetector';

describe('LangChain Intent Detector', () => {
    // Note: These tests require a valid OpenAI API key in .env
    
    describe('Intent Classification', () => {
        test('should detect greet intent from various greetings', async () => {
            const greetings = [
                'hello',
                'hi there',
                'good morning',
                'hey how are you'
            ];
            
            for (const greeting of greetings) {
                const intent = await detectIntentWithLangChain(greeting);
                expect(intent).toBe('greet');
            }
        }, 30000); // Longer timeout for API calls

        test('should detect loan_inquiry intent from loan requests', async () => {
            const loanRequests = [
                'I need a loan',
                'Can I borrow money?',
                'I want to apply for a mortgage',
                'Looking for financing options'
            ];
            
            for (const request of loanRequests) {
                const intent = await detectIntentWithLangChain(request);
                expect(intent).toBe('loan_inquiry');
            }
        }, 30000);

        test('should detect exit intent from goodbye messages', async () => {
            const farewells = [
                'goodbye',
                'bye',
                'see you later',
                'I want to exit'
            ];
            
            for (const farewell of farewells) {
                const intent = await detectIntentWithLangChain(farewell);
                expect(intent).toBe('exit');
            }
        }, 30000);

        test('should detect unknown intent for unrelated queries', async () => {
            const unknownQueries = [
                'what is the weather like?',
                'tell me a joke',
                'what time is it?',
                'how do I cook pasta?'
            ];
            
            for (const query of unknownQueries) {
                const intent = await detectIntentWithLangChain(query);
                expect(intent).toBe('unknown');
            }
        }, 30000);
    });

    describe('Edge Cases', () => {
        test('should handle empty string', async () => {
            const intent = await detectIntentWithLangChain('');
            expect(intent).toBe('unknown');
        }, 15000);

        test('should handle very long input', async () => {
            const longInput = 'hello '.repeat(100) + 'I need a loan';
            const intent = await detectIntentWithLangChain(longInput);
            expect(['greet', 'loan_inquiry', 'unknown']).toContain(intent);
        }, 15000);

        test('should handle special characters', async () => {
            const intent = await detectIntentWithLangChain('!@#$%^&*()');
            expect(intent).toBe('unknown');
        }, 15000);

        test('should handle mixed intent signals', async () => {
            const intent = await detectIntentWithLangChain('hello, I need a loan, goodbye');
            // Could be any of these depending on which OpenAI prioritizes
            expect(['greet', 'loan_inquiry', 'exit']).toContain(intent);
        }, 15000);
    });

    describe('Response Validation', () => {
        test('should always return a valid intent', async () => {
            const validIntents = ['greet', 'loan_inquiry', 'exit', 'unknown'];
            const intent = await detectIntentWithLangChain('hello world');
            expect(validIntents).toContain(intent);
        }, 15000);

        test('should return string type', async () => {
            const intent = await detectIntentWithLangChain('test message');
            expect(typeof intent).toBe('string');
        }, 15000);
    });
}); 