const { conversationMemory } = require('../../dist/memory/conversationMemory');

describe('Conversation Memory', () => {
    beforeEach(() => {
        conversationMemory.clearConversation();
    });

    describe('basic memory operations', () => {
        test('should start a new conversation', () => {
            conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '50000' });
            
            expect(conversationMemory.getCurrentIntent()).toBe('loan_inquiry');
            expect(conversationMemory.getCollectedSlots()).toEqual({ amount: '50000' });
        });

        test('should merge slots in continuing conversation', () => {
            conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '50000' });
            conversationMemory.startOrContinueConversation('loan_inquiry', { purpose: 'business' });
            
            expect(conversationMemory.getCollectedSlots()).toEqual({
                amount: '50000',
                purpose: 'business'
            });
        });

        test('should update existing slot values', () => {
            conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '50000' });
            conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '75000' });
            
            expect(conversationMemory.getCollectedSlots()).toEqual({ amount: '75000' });
        });

        test('should clear conversation memory', () => {
            conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '50000' });
            conversationMemory.clearConversation();
            
            expect(conversationMemory.getCurrentIntent()).toBe(null);
            expect(conversationMemory.getCollectedSlots()).toEqual({});
        });
    });

    describe('conversation continuity', () => {
        test('should recognize same intent as continuing conversation', () => {
            conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '50000' });
            
            expect(conversationMemory.isCurrentConversation('loan_inquiry')).toBe(true);
            expect(conversationMemory.isCurrentConversation('greet')).toBe(false);
        });

        test('should start new conversation for different intent', () => {
            conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '50000' });
            conversationMemory.startOrContinueConversation('greet', {});
            
            expect(conversationMemory.getCurrentIntent()).toBe('greet');
            expect(conversationMemory.getCollectedSlots()).toEqual({});
        });

        test('should handle empty slots gracefully', () => {
            conversationMemory.startOrContinueConversation('loan_inquiry', {});
            
            expect(conversationMemory.getCollectedSlots()).toEqual({});
            expect(conversationMemory.getCurrentIntent()).toBe('loan_inquiry');
        });
    });

    describe('conversation timeout', () => {
        test('should consider conversation as current for same intent', () => {
            conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '50000' });
            
            // Immediately check - should be current
            expect(conversationMemory.isCurrentConversation('loan_inquiry')).toBe(true);
        });

        test('should handle conversation state correctly', () => {
            conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '50000' });
            
            // Check state is maintained
            expect(conversationMemory.getCurrentIntent()).toBe('loan_inquiry');
            expect(conversationMemory.getCollectedSlots()).toEqual({ amount: '50000' });
        });
    });

    describe('slot management', () => {
        test('should preserve existing slots when adding new ones', () => {
            conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '50000' });
            conversationMemory.startOrContinueConversation('loan_inquiry', { purpose: 'business' });
            
            const slots = conversationMemory.getCollectedSlots();
            expect(slots.amount).toBe('50000');
            expect(slots.purpose).toBe('business');
        });

        test('should handle complex slot values', () => {
            const complexSlot = { amount: '50000', metadata: { validated: true } };
            conversationMemory.startOrContinueConversation('loan_inquiry', complexSlot);
            
            expect(conversationMemory.getCollectedSlots()).toEqual(complexSlot);
        });

        test('should return copy of slots, not reference', () => {
            conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '50000' });
            
            const slots1 = conversationMemory.getCollectedSlots();
            const slots2 = conversationMemory.getCollectedSlots();
            
            expect(slots1).toEqual(slots2);
            expect(slots1).not.toBe(slots2); // Different references
        });
    });
}); 