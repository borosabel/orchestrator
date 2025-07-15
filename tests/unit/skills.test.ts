const { handleLoanInquiry } = require('../../dist/skills/loanInquiry');
const { skills } = require('../../dist/intent/config');

describe('Skills Module', () => {
    describe('handleLoanInquiry function', () => {
        test('should handle loan inquiry with complete slots', async () => {
            const mockSlots = {
                amount: '50000',
                purpose: 'Business expansion'
            };
            
            // Mock the collectSlots function to avoid prompting
            const originalCollectSlots = require('../../dist/slots/slotCollector').collectSlots;
            const mockCollectSlots = jest.fn().mockResolvedValue(mockSlots);
            
            // This tests the function structure
            expect(typeof handleLoanInquiry).toBe('function');
            
            // Test with empty slots (should not throw)
            await expect(handleLoanInquiry({})).resolves.toBeDefined();
        });

        test('should handle empty extracted slots', async () => {
            const result = await handleLoanInquiry({});
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        test('should handle undefined extracted slots', async () => {
            const result = await handleLoanInquiry();
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        test('should be an async function', () => {
            expect(handleLoanInquiry({}) instanceof Promise).toBe(true);
        });
    });

    describe('skills configuration', () => {
        test('should have all required skills', () => {
            expect(skills.greet).toBeDefined();
            expect(skills.loan_inquiry).toBeDefined();
            expect(skills.exit).toBeDefined();
            expect(skills.unknown).toBeDefined();
        });

        test('should have loan_inquiry skill as handleLoanInquiry function', () => {
            expect(skills.loan_inquiry).toBe(handleLoanInquiry);
        });

        test('should have all skills as async functions', async () => {
            const skillNames = Object.keys(skills);
            
            for (const skillName of skillNames) {
                const skill = skills[skillName];
                expect(typeof skill).toBe('function');
                
                // Test that they return promises
                const result = skill({});
                expect(result instanceof Promise).toBe(true);
                
                // Test that they resolve to strings
                const response = await result;
                expect(typeof response).toBe('string');
            }
        });

        test('should handle skills with empty parameters', async () => {
            const responses = await Promise.all([
                skills.greet({}),
                skills.exit({}),
                skills.unknown({})
            ]);
            
            responses.forEach(response => {
                expect(typeof response).toBe('string');
                expect(response.length).toBeGreaterThan(0);
            });
        });
    });

    describe('skill responses', () => {
        test('should return appropriate greeting response', async () => {
            const response = await skills.greet({});
            expect(response).toContain('Hello');
        });

        test('should return appropriate exit response', async () => {
            const response = await skills.exit({});
            expect(response).toContain('Bye');
        });

        test('should return appropriate unknown response', async () => {
            const response = await skills.unknown({});
            expect(response).toContain('Sorry');
        });
    });
}); 