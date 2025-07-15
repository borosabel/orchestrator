import { extractSlots, extractSlotsSync } from '../../src/slots/slotExtractor';
import { slotDefinitions } from '../../src/slots/slotDefinitions';
import { collectSlots } from '../../src/slots/slotCollector';

describe('Slot Definitions', () => {
    test('should have loan_inquiry slot definition', () => {
        expect(slotDefinitions.loan_inquiry).toBeDefined();
        expect(Array.isArray(slotDefinitions.loan_inquiry)).toBe(true);
        expect(slotDefinitions.loan_inquiry.length).toBe(2);
    });

    test('should have required slot types', () => {
        const loanSlots = slotDefinitions.loan_inquiry;
        const amountSlot = loanSlots.find(slot => slot.name === 'amount');
        const purposeSlot = loanSlots.find(slot => slot.name === 'purpose');
        
        expect(amountSlot?.type).toBe('input');
        expect(purposeSlot?.type).toBe('list');
        expect(purposeSlot?.choices).toBeDefined();
        expect(Array.isArray(purposeSlot?.choices)).toBe(true);
    });

    test('should have validation for amount', () => {
        const loanSlots = slotDefinitions.loan_inquiry;
        const amountSlot = loanSlots.find(slot => slot.name === 'amount');
        expect(amountSlot?.validate).toBeDefined();
        expect(typeof amountSlot?.validate).toBe('function');
    });
});

describe('Slot Extraction (LangChain)', () => {
    test('should extract numeric amounts from text', async () => {
        const result = await extractSlots('loan_inquiry', 'I need a loan for $50000');
        expect(result.amount).toBe('50000');
    }, 15000);

    test('should extract purpose from text', async () => {
        const result = await extractSlots('loan_inquiry', 'I need a home loan');
        expect(result.purpose).toBe('Home purchase');
    }, 15000);

    test('should extract both amount and purpose', async () => {
        const result = await extractSlots('loan_inquiry', 'I need a $25000 car loan');
        expect(result.amount).toBe('25000');
        expect(result.purpose).toBe('Car purchase');
    }, 15000);

    test('should handle written numbers', async () => {
        const result = await extractSlots('loan_inquiry', 'fifty thousand dollars for home');
        expect(result.amount).toBe('50000');
        expect(result.purpose).toBe('Home purchase');
    }, 15000);

    test('should understand synonyms', async () => {
        const result = await extractSlots('loan_inquiry', 'one hundred thousand for house');
        expect(result.amount).toBe('100000');
        expect(result.purpose).toBe('Home purchase');
    }, 15000);

    test('should handle context understanding', async () => {
        const result = await extractSlots('loan_inquiry', 'loan for starting a company');
        expect(result.purpose).toBe('Business expansion');
    }, 15000);

    test('should return empty object for unknown intent', async () => {
        const result = await extractSlots('unknown_intent', 'some text');
        expect(result).toEqual({});
    }, 15000);

    test('should return empty object when no slots found', async () => {
        const result = await extractSlots('loan_inquiry', 'hello there');
        expect(result).toEqual({});
    }, 15000);
});

describe('Slot Extraction (Regex Fallback)', () => {
    test('should extract numeric amounts from text', () => {
        const result = extractSlotsSync('loan_inquiry', 'I need a loan for $50000');
        expect(result.amount).toBe('50000');
    });

    test('should extract purpose from text', () => {
        const result = extractSlotsSync('loan_inquiry', 'I need a home loan');
        expect(result.purpose).toBe('Home purchase');
    });

    test('should extract both amount and purpose', () => {
        const result = extractSlotsSync('loan_inquiry', 'I need a $25000 car loan');
        expect(result.amount).toBe('25000');
        expect(result.purpose).toBe('Car purchase');
    });

    test('should return empty object for unknown intent', () => {
        const result = extractSlotsSync('unknown_intent', 'some text');
        expect(result).toEqual({});
    });

    test('should return empty object when no slots found', () => {
        const result = extractSlotsSync('loan_inquiry', 'hello there');
        expect(result).toEqual({});
    });
});

describe('Slot Collection', () => {
    test('should collect missing slots for loan_inquiry', async () => {
        const result = await collectSlots('loan_inquiry', {});
        expect(result).toBeDefined();
        expect(result.amount).toBeDefined();
        expect(result.purpose).toBeDefined();
    });

    test('should not overwrite pre-extracted slots', async () => {
        const preExtracted = { amount: '15000' };
        const result = await collectSlots('loan_inquiry', preExtracted);
        expect(result.amount).toBe('15000');
        expect(result.purpose).toBeDefined();
    });

    test('should handle unknown intent gracefully', async () => {
        const result = await collectSlots('unknown_intent', {});
        expect(result).toEqual({});
    });
}); 