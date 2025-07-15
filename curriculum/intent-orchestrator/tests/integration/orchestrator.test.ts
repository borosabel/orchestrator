import { detectIntent } from '../../src/intent/intentDetector';
import { extractSlots } from '../../src/slots/slotExtractor';
import { conversationMemory } from '../../src/memory/conversationMemory';
import { skills } from '../../src/intent/config';
import { slotDefinitions } from '../../src/slots/slotDefinitions';
import { collectSlots } from '../../src/slots/slotCollector';

describe('Orchestrator Integration Tests', () => {
    beforeEach(() => {
        conversationMemory.clearConversation();
    });

    describe('Complete Loan Inquiry Flow', () => {
        test('should handle complete loan request in one message', async () => {
            const userInput = 'I need a $50000 loan for a car purchase';
            
            // Simulate full orchestrator flow
            const intent = detectIntent(userInput);
            const extractedSlots = extractSlots(intent, userInput);
            conversationMemory.startOrContinueConversation(intent, extractedSlots);
            
            const allCollectedSlots = conversationMemory.getCollectedSlots();
            const requiredSlots = slotDefinitions[intent] || [];
            const missingSlots = requiredSlots.filter(slot => !allCollectedSlots[slot.name]);
            
            // Should have all required slots
            expect(missingSlots).toHaveLength(0);
            
            // Execute skill
            const handler = skills[intent as keyof typeof skills];
            const response = await handler(allCollectedSlots);
            
            expect(response).toContain('$50,000');
            expect(response).toContain('car purchase');
            expect(response).toContain('review your application');
        });

        test('should handle multi-turn conversation for loan inquiry', async () => {
            // Turn 1: User expresses general interest
            let userInput = 'I need a loan';
            let intent = detectIntent(userInput);
            let extractedSlots = extractSlots(intent, userInput);
            
            conversationMemory.startOrContinueConversation(intent, extractedSlots);
            let allCollectedSlots = conversationMemory.getCollectedSlots();
            let requiredSlots = slotDefinitions[intent] || [];
            let missingSlots = requiredSlots.filter(slot => !allCollectedSlots[slot.name]);
            
            // Should still need slots
            expect(missingSlots.length).toBeGreaterThan(0);
            
            // Turn 2: User provides amount
            userInput = '$30000';
            intent = detectIntent(userInput);
            extractedSlots = extractSlots('loan_inquiry', userInput); // Keep same intent
            
            conversationMemory.startOrContinueConversation('loan_inquiry', extractedSlots);
            allCollectedSlots = conversationMemory.getCollectedSlots();
            missingSlots = requiredSlots.filter(slot => !allCollectedSlots[slot.name]);
            
            // Should still need purpose
            expect(missingSlots).toHaveLength(1);
            expect(missingSlots[0].name).toBe('purpose');
            
            // Turn 3: User provides purpose
            userInput = 'for home purchase';
            extractedSlots = extractSlots('loan_inquiry', userInput);
            
            conversationMemory.startOrContinueConversation('loan_inquiry', extractedSlots);
            allCollectedSlots = conversationMemory.getCollectedSlots();
            missingSlots = requiredSlots.filter(slot => !allCollectedSlots[slot.name]);
            
            // Should have all slots now
            expect(missingSlots).toHaveLength(0);
            
            // Execute skill
            const handler = skills.loan_inquiry;
            const response = await handler(allCollectedSlots);
            
            expect(response).toContain('$30,000');
            expect(response).toContain('home purchase');
        });
    });

    describe('Conversation Memory Integration', () => {
        test('should maintain conversation state across turns', async () => {
            // First turn
            conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '25000' });
            
            expect(conversationMemory.getCurrentIntent()).toBe('loan_inquiry');
            expect(conversationMemory.isCurrentConversation('loan_inquiry')).toBe(true);
            
            // Second turn - should continue
            conversationMemory.startOrContinueConversation('loan_inquiry', { purpose: 'Education' });
            
            expect(conversationMemory.getCollectedSlots()).toEqual({
                amount: '25000',
                purpose: 'Education'
            });
        });

        test('should start new conversation for different intent', async () => {
            // Start loan inquiry
            conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '25000' });
            
            // Switch to greeting
            conversationMemory.startOrContinueConversation('greet', {});
            
            expect(conversationMemory.getCurrentIntent()).toBe('greet');
            expect(conversationMemory.getCollectedSlots()).toEqual({});
        });

        test('should handle conversation timeout', async () => {
            conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '25000' });
            
            // Mock time passing (6 minutes)
            const originalNow = Date.now;
            Date.now = jest.fn(() => originalNow() + 6 * 60 * 1000);
            
            // Should not be current conversation anymore
            expect(conversationMemory.isCurrentConversation('loan_inquiry')).toBe(false);
            
            // New conversation should start fresh
            conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '35000' });
            expect(conversationMemory.getCollectedSlots()).toEqual({ amount: '35000' });
            
            // Restore original Date.now
            Date.now = originalNow;
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle unknown intents gracefully', async () => {
            const userInput = 'what is the weather like';
            
            const intent = detectIntent(userInput);
            expect(intent).toBe('unknown');
            
            const handler = skills.unknown;
            const response = await handler({});
            
            expect(response).toBeDefined();
            expect(typeof response).toBe('string');
        });

        test('should handle slot collection when no slots needed', async () => {
            const intent = 'greet';
            const extractedSlots = extractSlots(intent, 'hello');
            
            conversationMemory.startOrContinueConversation(intent, extractedSlots);
            const allCollectedSlots = conversationMemory.getCollectedSlots();
            
            const requiredSlots = slotDefinitions[intent] || [];
            const missingSlots = requiredSlots.filter(slot => !allCollectedSlots[slot.name]);
            
            expect(missingSlots).toHaveLength(0);
            
            const handler = skills.greet;
            const response = await handler(allCollectedSlots);
            
            expect(response).toBeDefined();
        });

        test('should handle empty user input gracefully', async () => {
            const userInput = '';
            
            const intent = detectIntent(userInput);
            expect(intent).toBe('unknown');
            
            const extractedSlots = extractSlots(intent, userInput);
            expect(extractedSlots).toEqual({});
        });

        test('should handle malformed slot values', async () => {
            const slots = {
                amount: 'not a number',
                purpose: 'Business expansion'
            };
            
            const handler = skills.loan_inquiry;
            const response = await handler(slots);
            
            // Should handle gracefully - parseFloat('not a number') returns NaN
            expect(response).toBeDefined();
            expect(typeof response).toBe('string');
        });
    });

    describe('Slot Collection Integration', () => {
        test('should collect missing slots using prompts', async () => {
            const partialSlots = { amount: '40000' };
            
            const collectedSlots = await collectSlots('loan_inquiry', partialSlots);
            
            expect(collectedSlots).toBeDefined();
            expect(collectedSlots.amount).toBe('40000');
            expect(collectedSlots.purpose).toBeDefined();
        });

        test('should not collect slots for unknown intent', async () => {
            const collectedSlots = await collectSlots('unknown', {});
            
            expect(collectedSlots).toEqual({});
        });
    });

    describe('Full End-to-End Scenarios', () => {
        test('should handle complete user journey: greeting -> loan inquiry -> exit', async () => {
            // Step 1: Greeting
            let userInput = 'hello';
            let intent = detectIntent(userInput);
            let response = await skills[intent as keyof typeof skills]({});
            
            expect(intent).toBe('greet');
            expect(response).toBeDefined();
            
            // Step 2: Loan inquiry
            userInput = 'I need a $75000 business loan';
            intent = detectIntent(userInput);
            const extractedSlots = extractSlots(intent, userInput);
            
            conversationMemory.startOrContinueConversation(intent, extractedSlots);
            const allCollectedSlots = conversationMemory.getCollectedSlots();
            
            response = await skills[intent as keyof typeof skills](allCollectedSlots);
            
            expect(intent).toBe('loan_inquiry');
            expect(response).toContain('$75,000');
            expect(response).toContain('business expansion');
            
            // Step 3: Exit
            userInput = 'goodbye';
            intent = detectIntent(userInput);
            response = await skills[intent as keyof typeof skills]({});
            
            expect(intent).toBe('exit');
            expect(response).toBeDefined();
        });

        test('should handle mixed intent conversation', async () => {
            // Start with greeting
            let intent = detectIntent('hi there');
            expect(intent).toBe('greet');
            
            // Switch to loan inquiry
            intent = detectIntent('I need a loan');
            expect(intent).toBe('loan_inquiry');
            
            // Random question (should be unknown)
            intent = detectIntent('what time is it');
            expect(intent).toBe('unknown');
            
            // Back to loan inquiry
            intent = detectIntent('actually about that loan');
            expect(intent).toBe('loan_inquiry');
        });
    });
}); 