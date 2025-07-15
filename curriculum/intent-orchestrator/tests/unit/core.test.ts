import { detectIntent } from '../../src/intent/intentDetector';
import { skills } from '../../src/intent/config';
import { extractSlots } from '../../src/slots/slotExtractor';
import { conversationMemory } from '../../src/memory/conversationMemory';
import { slotDefinitions } from '../../src/slots/slotDefinitions';

describe('Core Orchestrator Logic', () => {
    beforeEach(() => {
        conversationMemory.clearConversation();
    });

    describe('Intent Detection Integration', () => {
        test('should detect valid intents from user input', () => {
            expect(detectIntent('hello')).toBe('greet');
            expect(detectIntent('I need a loan')).toBe('loan_inquiry');
            expect(detectIntent('goodbye')).toBe('exit');
            expect(detectIntent('random text')).toBe('unknown');
        });
    });

    describe('Slot Extraction Integration', () => {
        test('should extract slots from user input based on intent', () => {
            const intent = 'loan_inquiry';
            const userInput = 'I need a $50000 car loan';
            
            const extractedSlots = extractSlots(intent, userInput);
            
            expect(extractedSlots.amount).toBe('50000');
            expect(extractedSlots.purpose).toBe('Car purchase');
        });
    });

    describe('Conversation Memory Integration', () => {
        test('should manage conversation state correctly', () => {
            const intent = 'loan_inquiry';
            const extractedSlots = { amount: '25000' };
            
            conversationMemory.startOrContinueConversation(intent, extractedSlots);
            
            expect(conversationMemory.getCurrentIntent()).toBe(intent);
            expect(conversationMemory.getCollectedSlots()).toEqual(extractedSlots);
        });

        test('should continue conversation with additional slots', () => {
            conversationMemory.startOrContinueConversation('loan_inquiry', { amount: '25000' });
            conversationMemory.startOrContinueConversation('loan_inquiry', { purpose: 'Home purchase' });
            
            expect(conversationMemory.getCollectedSlots()).toEqual({
                amount: '25000',
                purpose: 'Home purchase'
            });
        });
    });

    describe('Skills Integration', () => {
        test('should have handlers for all intents', () => {
            expect(skills.greet).toBeDefined();
            expect(skills.loan_inquiry).toBeDefined();
            expect(skills.exit).toBeDefined();
            expect(skills.unknown).toBeDefined();
        });

        test('should execute loan inquiry skill', async () => {
            const handler = skills.loan_inquiry;
            const slots = { amount: '30000', purpose: 'Education' };
            
            const result = await handler(slots);
            
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result).toContain('$30,000');
            expect(result).toContain('education');
        });

        test('should execute greet skill', async () => {
            const handler = skills.greet;
            const result = await handler({});
            
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        test('should execute unknown skill', async () => {
            const handler = skills.unknown;
            const result = await handler({});
            
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });
    });

    describe('Slot Definition Integration', () => {
        test('should identify missing slots for intent', () => {
            const intent = 'loan_inquiry';
            const collectedSlots: Record<string, any> = { amount: '25000' };
            
            const requiredSlots = slotDefinitions[intent] || [];
            const missingSlots = requiredSlots.filter(slot => !collectedSlots[slot.name]);
            
            expect(missingSlots).toHaveLength(1);
            expect(missingSlots[0].name).toBe('purpose');
        });

        test('should identify when all slots are collected', () => {
            const intent = 'loan_inquiry';
            const collectedSlots: Record<string, any> = { amount: '25000', purpose: 'Home purchase' };
            
            const requiredSlots = slotDefinitions[intent] || [];
            const missingSlots = requiredSlots.filter(slot => !collectedSlots[slot.name]);
            
            expect(missingSlots).toHaveLength(0);
        });
    });

    describe('End-to-End Orchestration Flow', () => {
        test('should handle complete loan inquiry flow', async () => {
            const userInput = 'I need a $40000 home loan';
            
            // Step 1: Detect intent
            const intent = detectIntent(userInput);
            expect(intent).toBe('loan_inquiry');
            
            // Step 2: Extract slots
            const extractedSlots = extractSlots(intent, userInput);
            expect(extractedSlots.amount).toBe('40000');
            expect(extractedSlots.purpose).toBe('Home purchase');
            
            // Step 3: Start conversation
            conversationMemory.startOrContinueConversation(intent, extractedSlots);
            const allCollectedSlots = conversationMemory.getCollectedSlots();
            
            // Step 4: Check for missing slots
            const requiredSlots = slotDefinitions[intent] || [];
            const missingSlots = requiredSlots.filter(slot => !allCollectedSlots[slot.name]);
            expect(missingSlots).toHaveLength(0);
            
            // Step 5: Execute skill
            const handler = skills[intent as keyof typeof skills];
            const response = await handler(allCollectedSlots);
            
            expect(response).toContain('$40,000');
            expect(response).toContain('home purchase');
        });

        test('should handle partial information requiring follow-up', async () => {
            const userInput = 'I need a loan';
            
            // Step 1: Detect intent
            const intent = detectIntent(userInput);
            expect(intent).toBe('loan_inquiry');
            
            // Step 2: Extract slots (should be empty)
            const extractedSlots = extractSlots(intent, userInput);
            expect(extractedSlots).toEqual({});
            
            // Step 3: Start conversation
            conversationMemory.startOrContinueConversation(intent, extractedSlots);
            const allCollectedSlots = conversationMemory.getCollectedSlots();
            
            // Step 4: Check for missing slots (should have missing slots)
            const requiredSlots = slotDefinitions[intent] || [];
            const missingSlots = requiredSlots.filter(slot => !allCollectedSlots[slot.name]);
            expect(missingSlots.length).toBeGreaterThan(0);
        });
    });
}); 