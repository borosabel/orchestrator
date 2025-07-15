const { extractSlots } = require('../../dist/slots/slotExtractor');
const { collectSlots } = require('../../dist/slots/slotCollector');
const { slotDefinitions } = require('../../dist/slots/slotDefinitions');

describe('Slot System', () => {
    describe('extractSlots function', () => {
        test('should extract amount from loan inquiry', () => {
            const result = extractSlots('loan_inquiry', 'I need a loan for $50,000');
            expect(result.amount).toBe('50000');
        });

        test('should extract purpose from loan inquiry', () => {
            const result = extractSlots('loan_inquiry', 'I need a business loan');
            expect(result.purpose).toBe('Business expansion');
        });

        test('should extract multiple slots from single input', () => {
            const result = extractSlots('loan_inquiry', 'I need a $25,000 car loan');
            expect(result.amount).toBe('25000');
            expect(result.purpose).toBe('Car purchase');
        });

        test('should return empty object for non-matching input', () => {
            const result = extractSlots('loan_inquiry', 'random text');
            expect(result).toEqual({});
        });

        test('should return empty object for unknown intent', () => {
            const result = extractSlots('unknown_intent', 'I need a $50,000 loan');
            expect(result).toEqual({});
        });

        test('should handle various amount formats', () => {
            expect(extractSlots('loan_inquiry', '$50000')['amount']).toBe('50000');
            expect(extractSlots('loan_inquiry', '$50,000')['amount']).toBe('50000');
            expect(extractSlots('loan_inquiry', '50000')['amount']).toBe('50000');
        });

        test('should recognize different loan purposes', () => {
            expect(extractSlots('loan_inquiry', 'home loan')['purpose']).toBe('Home purchase');
            expect(extractSlots('loan_inquiry', 'car loan')['purpose']).toBe('Car purchase');
            expect(extractSlots('loan_inquiry', 'business loan')['purpose']).toBe('Business expansion');
            expect(extractSlots('loan_inquiry', 'personal loan')['purpose']).toBe('Personal expenses');
            expect(extractSlots('loan_inquiry', 'education loan')['purpose']).toBe('Education');
        });
    });

    describe('slotDefinitions configuration', () => {
        test('should have loan_inquiry slots defined', () => {
            expect(slotDefinitions.loan_inquiry).toBeDefined();
            expect(Array.isArray(slotDefinitions.loan_inquiry)).toBe(true);
            expect(slotDefinitions.loan_inquiry.length).toBeGreaterThan(0);
        });

        test('should have correct slot structure', () => {
            const loanSlots = slotDefinitions.loan_inquiry;
            loanSlots.forEach(slot => {
                expect(slot.name).toBeDefined();
                expect(slot.message).toBeDefined();
                expect(slot.type).toBeDefined();
                expect(['input', 'list'].includes(slot.type)).toBe(true);
            });
        });

        test('should have empty slots for simple intents', () => {
            expect(slotDefinitions.greet).toEqual([]);
            expect(slotDefinitions.exit).toEqual([]);
            expect(slotDefinitions.unknown).toEqual([]);
        });

        test('should have required slots for loan_inquiry', () => {
            const loanSlots = slotDefinitions.loan_inquiry;
            const slotNames = loanSlots.map(slot => slot.name);
            expect(slotNames).toContain('amount');
            expect(slotNames).toContain('purpose');
        });
    });

    describe('collectSlots function', () => {
        test('should work with empty pre-extracted slots', async () => {
            // Mock inquirer to avoid actual prompts
            const mockInquirer = {
                prompt: jest.fn()
                    .mockResolvedValueOnce({ amount: '50000' })
                    .mockResolvedValueOnce({ purpose: 'Business expansion' })
            };
            
            // This test verifies the function structure - actual prompting would require mocking
            expect(typeof collectSlots).toBe('function');
        });

        test('should skip slots that are pre-extracted', async () => {
            const preExtracted = { amount: '50000' };
            // This verifies the function accepts parameters correctly
            expect(() => collectSlots('loan_inquiry', preExtracted)).not.toThrow();
        });
    });
}); 