import { conversationMemory } from '../../src/memory/conversationMemory';

describe('Conversation Memory', () => {
    beforeEach(() => {
        conversationMemory.clearConversation();
    });

    test('should initialize with empty memory', () => {
        expect(conversationMemory.getCollectedSlots()).toEqual({});
        expect(conversationMemory.getCurrentIntent()).toBeNull();
    });

    test('should start new conversation', () => {
        conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '10000' });
        
        expect(conversationMemory.getCurrentIntent()).toBe('loan_inquiry');
        expect(conversationMemory.getCollectedSlots()).toEqual({ amount: '10000' });
    });

    test('should continue existing conversation', () => {
        conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '10000' });
        conversationMemory.startOrContinueConversation('loan_inquiry', { purpose: 'Home purchase' });
        
        expect(conversationMemory.getCurrentIntent()).toBe('loan_inquiry');
        expect(conversationMemory.getCollectedSlots()).toEqual({
            amount: '10000',
            purpose: 'Home purchase'
        });
    });

    test('should detect current conversation', () => {
        conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '10000' });
        
        expect(conversationMemory.isCurrentConversation('loan_inquiry')).toBe(true);
        expect(conversationMemory.isCurrentConversation('greet')).toBe(false);
    });

    test('should start fresh conversation for different intent', () => {
        conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '10000' });
        conversationMemory.startOrContinueConversation('greet', { name: 'John' });
        
        expect(conversationMemory.getCurrentIntent()).toBe('greet');
        expect(conversationMemory.getCollectedSlots()).toEqual({ name: 'John' });
    });

    test('should clear conversation', () => {
        conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '10000' });
        conversationMemory.clearConversation();
        
        expect(conversationMemory.getCurrentIntent()).toBeNull();
        expect(conversationMemory.getCollectedSlots()).toEqual({});
    });

    test('should handle timeout correctly', () => {
        conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '10000' });
        
        // Mock time passing (5+ minutes)
        const originalNow = Date.now;
        Date.now = jest.fn(() => originalNow() + 6 * 60 * 1000);
        
        expect(conversationMemory.isCurrentConversation('loan_inquiry')).toBe(false);
        
        // Restore original Date.now
        Date.now = originalNow;
    });

    test('should merge slots in continuing conversation', () => {
        conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '10000' });
        conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '15000', purpose: 'Car purchase' });
        
        expect(conversationMemory.getCollectedSlots()).toEqual({
            amount: '15000',
            purpose: 'Car purchase'
        });
    });
}); 