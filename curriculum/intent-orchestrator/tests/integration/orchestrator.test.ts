import { genericOrchestrator } from '../../src/core/genericOrchestrator';
import { appointmentDomainConfig } from '../../src/domains/appointments.config';
import { bankingDomainConfig } from '../../src/domains/banking.config';
import { healthcareDomainConfig } from '../../src/domains/healthcare.config';

describe('Generic Orchestrator Integration Tests', () => {
    beforeAll(async () => {
        // Load all domain configurations
        await genericOrchestrator.loadDomain(appointmentDomainConfig);
        await genericOrchestrator.loadDomain(bankingDomainConfig);
        await genericOrchestrator.loadDomain(healthcareDomainConfig);
    });

    describe('Appointments Domain Integration', () => {
        beforeEach(async () => {
            await genericOrchestrator.switchDomain('appointments');
        });

        test('should handle complete appointment scheduling flow', async () => {
            const userInput = 'I want to schedule a medical consultation for tomorrow at 2pm';
            
            const result = await genericOrchestrator.processMessageDetailed(userInput);
            
            expect(result.intent).toBe('schedule_appointment');
            expect(result.domain).toBe('appointments');
            expect(result.response).toBeDefined();
            expect(result.response.length).toBeGreaterThan(50);
            expect(result.processingTime).toBeGreaterThan(0);
        }, 20000);

        test('should handle appointment cancellation flow', async () => {
            const userInput = 'Cancel my appointment APT-123456';
            
            const result = await genericOrchestrator.processMessageDetailed(userInput);
            
            expect(result.intent).toBe('cancel_appointment');
            expect(result.slots.confirmation_id).toBe('APT-123456');
            expect(result.response).toContain('Cancelled');
            expect(result.domain).toBe('appointments');
        }, 15000);

        test('should handle availability checking flow', async () => {
            const userInput = 'What medical appointments are available tomorrow morning?';
            
            const result = await genericOrchestrator.processMessageDetailed(userInput);
            
            expect(result.intent).toBe('check_availability');
            expect(result.domain).toBe('appointments');
            expect(result.response).toBeDefined();
        }, 15000);

        test('should handle conversational flow with greetings and exits', async () => {
            // Test greeting
            let response = await genericOrchestrator.processMessage('Hello');
            expect(response).toContain('Welcome');
            
            // Test main functionality
            response = await genericOrchestrator.processMessage('I need an appointment');
            expect(response).toBeDefined();
            
            // Test exit
            response = await genericOrchestrator.processMessage('Goodbye');
            expect(response).toContain('Thank you');
        }, 30000);
    });

    describe('Banking Domain Integration', () => {
        beforeEach(async () => {
            await genericOrchestrator.switchDomain('banking');
        });

        test('should handle banking loan inquiry flow', async () => {
            const userInput = 'I need a $50000 loan for a car purchase';
            
            const result = await genericOrchestrator.processMessageDetailed(userInput);
            
            expect(result.intent).toBe('loan_inquiry');
            expect(result.domain).toBe('banking');
            expect(result.slots.amount).toBe('50000');
            expect(result.slots.purpose).toBe('Car purchase');
            expect(result.response).toContain('$50,000');
        }, 15000);

        test('should handle balance checking flow', async () => {
            const userInput = 'What\'s my account balance?';
            
            const result = await genericOrchestrator.processMessageDetailed(userInput);
            
            expect(result.intent).toBe('balance_check');
            expect(result.domain).toBe('banking');
            expect(result.response).toContain('Balance');
        }, 15000);

        test('should handle transaction history flow', async () => {
            const userInput = 'Show me my recent transactions';
            
            const result = await genericOrchestrator.processMessageDetailed(userInput);
            
            expect(result.intent).toBe('transaction_history');
            expect(result.domain).toBe('banking');
            expect(result.response).toContain('Transaction');
        }, 15000);
    });

    describe('Healthcare Domain Integration', () => {
        beforeEach(async () => {
            await genericOrchestrator.switchDomain('healthcare');
        });

        test('should handle healthcare appointment scheduling', async () => {
            const userInput = 'I need to see a cardiologist urgently';
            
            const result = await genericOrchestrator.processMessageDetailed(userInput);
            
            expect(result.intent).toBe('schedule_appointment');
            expect(result.domain).toBe('healthcare');
            expect(result.slots.specialty).toBe('Cardiology');
            expect(result.slots.urgency).toBe('Urgent (within 3 days)');
        }, 15000);

        test('should handle symptom checking', async () => {
            const userInput = 'I have severe chest pain for 2 hours, severity 8';
            
            const result = await genericOrchestrator.processMessageDetailed(userInput);
            
            expect(result.intent).toBe('symptom_check');
            expect(result.domain).toBe('healthcare');
            expect(result.response).toContain('Priority');
        }, 15000);

        test('should handle prescription refills', async () => {
            const userInput = 'Refill my blood pressure medication at CVS';
            
            const result = await genericOrchestrator.processMessageDetailed(userInput);
            
            expect(result.intent).toBe('prescription_refill');
            expect(result.domain).toBe('healthcare');
            expect(result.response).toContain('Prescription');
        }, 15000);

        test('should handle medical records requests', async () => {
            const userInput = 'Show me my lab results from last month';
            
            const result = await genericOrchestrator.processMessageDetailed(userInput);
            
            expect(result.intent).toBe('medical_records');
            expect(result.domain).toBe('healthcare');
            expect(result.response).toContain('Records');
        }, 15000);
    });

    describe('Multi-Domain Switching', () => {
        test('should maintain context when switching domains', async () => {
            // Start with appointments
            await genericOrchestrator.switchDomain('appointments');
            let result = await genericOrchestrator.processMessageDetailed('Schedule an appointment');
            expect(result.domain).toBe('appointments');
            expect(result.intent).toBe('schedule_appointment');

            // Switch to banking
            await genericOrchestrator.switchDomain('banking');
            result = await genericOrchestrator.processMessageDetailed('Check my balance');
            expect(result.domain).toBe('banking');
            expect(result.intent).toBe('balance_check');

            // Switch to healthcare
            await genericOrchestrator.switchDomain('healthcare');
            result = await genericOrchestrator.processMessageDetailed('I have a headache');
            expect(result.domain).toBe('healthcare');
            expect(result.intent).toBe('symptom_check');
        }, 30000);

        test('should handle same user input differently across domains', async () => {
            const userInput = 'I need an appointment';

            // Appointments domain
            await genericOrchestrator.switchDomain('appointments');
            let result = await genericOrchestrator.processMessageDetailed(userInput);
            expect(result.domain).toBe('appointments');
            expect(result.intent).toBe('schedule_appointment');

            // Healthcare domain
            await genericOrchestrator.switchDomain('healthcare');
            result = await genericOrchestrator.processMessageDetailed(userInput);
            expect(result.domain).toBe('healthcare');
            expect(result.intent).toBe('schedule_appointment');

            // Responses should be different but both valid
            expect(result.response).toBeDefined();
        }, 30000);
    });

    describe('Error Handling and Edge Cases', () => {
        beforeEach(async () => {
            await genericOrchestrator.switchDomain('appointments');
        });

        test('should handle empty input gracefully', async () => {
            const result = await genericOrchestrator.processMessageDetailed('');
            expect(result.intent).toBe('unknown');
            expect(result.response).toContain('understand');
        });

        test('should handle completely random input', async () => {
            const result = await genericOrchestrator.processMessageDetailed('xyz123!@# random gibberish');
            expect(result.intent).toBe('unknown');
            expect(result.response).toBeDefined();
        });

        test('should handle very long input', async () => {
            const longInput = 'I want to schedule an appointment '.repeat(20);
            const result = await genericOrchestrator.processMessageDetailed(longInput);
            expect(result.intent).toBe('schedule_appointment');
            expect(result.response).toBeDefined();
        }, 20000);

        test('should provide meaningful error responses', async () => {
            const response = await genericOrchestrator.processMessage('asdfasdfasdf');
            expect(response).toBeDefined();
            expect(response.length).toBeGreaterThan(10);
            expect(response).toContain('understand');
        });
    });

    describe('Performance and Reliability', () => {
        beforeEach(async () => {
            await genericOrchestrator.switchDomain('appointments');
        });

        test('should process messages within reasonable time', async () => {
            const startTime = Date.now();
            const result = await genericOrchestrator.processMessageDetailed('Hello');
            const endTime = Date.now();
            
            expect(result.processingTime).toBeLessThan(10000); // Less than 10 seconds
            expect(endTime - startTime).toBeLessThan(15000); // Total less than 15 seconds
        }, 20000);

        test('should handle multiple concurrent requests', async () => {
            const requests = [
                'Hello',
                'Schedule appointment',
                'Check availability',
                'Cancel appointment APT-123456',
                'Goodbye'
            ];

            const promises = requests.map(input => 
                genericOrchestrator.processMessage(input)
            );

            const responses = await Promise.all(promises);
            
            expect(responses).toHaveLength(5);
            responses.forEach(response => {
                expect(response).toBeDefined();
                expect(typeof response).toBe('string');
            });
        }, 30000);
    });
}); 