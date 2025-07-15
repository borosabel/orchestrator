import { handleLoanInquiry } from '../../src/skills/loanInquiry';

describe('Loan Inquiry Skill', () => {
    test('should handle loan inquiry with complete slots', async () => {
        const slots = {
            amount: '25000',
            purpose: 'Car purchase'
        };
        
        const result = await handleLoanInquiry(slots);
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result).toContain('$25,000');
        expect(result).toContain('Car purchase');
        expect(result).toContain('review your application');
        expect(result).toContain('💰 **Loan Application Details**');
        expect(result).toContain('📊 **Amount:**');
        expect(result).toContain('🎯 **Purpose:**');
    });

    test('should handle different loan amounts', async () => {
        const slots = {
            amount: '100000',
            purpose: 'Home purchase'
        };
        
        const result = await handleLoanInquiry(slots);
        
        expect(result).toContain('$100,000');
        expect(result).toContain('Home purchase');
        expect(result).toContain('💰 **Loan Application Details**');
    });

    test('should handle various loan purposes', async () => {
        const purposes = ['Business expansion', 'Education', 'Personal expenses'];
        
        for (const purpose of purposes) {
            const slots = {
                amount: '15000',
                purpose: purpose
            };
            
            const result = await handleLoanInquiry(slots);
            expect(result).toContain(purpose); // Check exact case match
            expect(result).toContain('💰 **Loan Application Details**');
            expect(result).toContain('🎯 **Purpose:**');
        }
    });

    test('should handle empty slots gracefully', async () => {
        const result = await handleLoanInquiry({});
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    test('should handle partial slots', async () => {
        const slotsWithAmount = { amount: '50000' };
        const slotsWithPurpose = { purpose: 'Education' };
        
        const resultAmount = await handleLoanInquiry(slotsWithAmount);
        const resultPurpose = await handleLoanInquiry(slotsWithPurpose);
        
        expect(resultAmount).toBeDefined();
        expect(resultPurpose).toBeDefined();
        expect(resultAmount).toContain('$50,000');
        expect(resultAmount).toContain('general purposes'); // Default purpose when only amount provided
        expect(resultPurpose).toContain('how much'); // Should ask for amount when only purpose provided
    });

    test('should return consistent professional response format', async () => {
        const slots = {
            amount: '20000',
            purpose: 'Personal expenses'
        };
        
        const result = await handleLoanInquiry(slots);
        
        // Check that response follows professional format
        expect(result).toContain('💰 **Loan Application Details**');
        expect(result).toContain('✅ **Next Steps:**');
        expect(result).toContain('📋 **Required Documents:**');
        expect(result).toContain('💡 **Estimated monthly payment:**');
        expect(result).toContain('📞 Questions? Call our loan specialists');
        expect(result).toContain("We'll review your application");
        expect(result.length).toBeGreaterThan(100);
        expect(result.length).toBeLessThan(800);
    });

    test('should handle string amounts without formatting issues', async () => {
        const slots = {
            amount: '1234567',
            purpose: 'Business expansion'
        };
        
        const result = await handleLoanInquiry(slots);
        
        expect(result).toContain('$1,234,567');
    });

    test('should be async and return Promise', async () => {
        const slots = { amount: '10000', purpose: 'Education' };
        
        const resultPromise = handleLoanInquiry(slots);
        
        expect(resultPromise).toBeInstanceOf(Promise);
        
        const result = await resultPromise;
        expect(typeof result).toBe('string');
    });
}); 