import { genericOrchestrator } from '../../src/core/genericOrchestrator';
import { appointmentDomainConfig } from '../../src/domains/appointments.config';
import { bankingDomainConfig } from '../../src/domains/banking.config';

describe('Generic Orchestrator Core Logic', () => {
    beforeAll(async () => {
        // Load the appointments domain configuration
        await genericOrchestrator.loadDomain(appointmentDomainConfig);
    });

    describe('Domain Loading and Management', () => {
        test('should load domain configuration successfully', async () => {
            const status = genericOrchestrator.getStatus();
            expect(status.ready).toBe(true);
            expect(status.currentDomain).toBe('appointments');
            expect(status.supportedIntents).toBeGreaterThan(0);
        });

        test('should get current domain information', () => {
            const domainInfo = genericOrchestrator.getCurrentDomain();
            expect(domainInfo).toBeDefined();
            expect(domainInfo.name).toBe('appointments');
            expect(domainInfo.version).toBe('1.0.0');
            expect(domainInfo.description).toContain('appointment');
        });

        test('should load multiple domains', async () => {
            // Load banking domain
            const loaded = await genericOrchestrator.loadDomain(bankingDomainConfig);
            expect(loaded).toBe(true);

            // Check available domains
            const domains = genericOrchestrator.getAvailableDomains();
            expect(domains).toContain('appointments');
            expect(domains).toContain('banking');
        });

        test('should switch between domains', async () => {
            // Switch to appointments
            const switched = await genericOrchestrator.switchDomain('appointments');
            expect(switched).toBe(true);
            
            let status = genericOrchestrator.getStatus();
            expect(status.currentDomain).toBe('appointments');

            // Switch to banking
            const switchedToBanking = await genericOrchestrator.switchDomain('banking');
            expect(switchedToBanking).toBe(true);
            
            status = genericOrchestrator.getStatus();
            expect(status.currentDomain).toBe('banking');
        });
    });

    describe('Message Processing Integration', () => {
        beforeEach(async () => {
            // Ensure we're using appointments domain for these tests
            await genericOrchestrator.switchDomain('appointments');
        });

        test('should process greet messages', async () => {
            const response = await genericOrchestrator.processMessage('Hello');
            expect(response).toBeDefined();
            expect(response).toContain('Welcome');
        }, 15000);

        test('should process appointment scheduling requests', async () => {
            const response = await genericOrchestrator.processMessage('I want to schedule an appointment for tomorrow');
            expect(response).toBeDefined();
            expect(response.length).toBeGreaterThan(10);
        }, 15000);

        test('should process availability checks', async () => {
            const response = await genericOrchestrator.processMessage('What\'s available tomorrow morning?');
            expect(response).toBeDefined();
            expect(response.length).toBeGreaterThan(10);
        }, 15000);

        test('should process cancellation requests', async () => {
            const response = await genericOrchestrator.processMessage('Cancel appointment APT-123456');
            expect(response).toBeDefined();
            expect(response.length).toBeGreaterThan(10);
        }, 15000);

        test('should handle unknown input gracefully', async () => {
            const response = await genericOrchestrator.processMessage('xyz random gibberish 123');
            expect(response).toBeDefined();
            expect(response).toContain('understand');
        }, 15000);
    });

    describe('Detailed Processing Information', () => {
        beforeEach(async () => {
            await genericOrchestrator.switchDomain('appointments');
        });

        test('should provide detailed processing information', async () => {
            const result = await genericOrchestrator.processMessageDetailed('Schedule a medical appointment');
            
            expect(result).toBeDefined();
            expect(result.input).toBe('Schedule a medical appointment');
            expect(result.intent).toBeDefined();
            expect(result.slots).toBeDefined();
            expect(result.response).toBeDefined();
            expect(result.domain).toBe('appointments');
            expect(result.processingTime).toBeGreaterThan(0);
        }, 15000);

        test('should handle errors in detailed processing', async () => {
            // Force an error by processing without a loaded domain
            genericOrchestrator.getCurrentDomain = () => null;
            
            const result = await genericOrchestrator.processMessageDetailed('test');
            expect(result.intent).toBe('error');
            expect(result.response).toContain('No domain');
            
            // Restore normal function
            await genericOrchestrator.switchDomain('appointments');
        });
    });

    describe('Supported Intents Information', () => {
        beforeEach(async () => {
            await genericOrchestrator.switchDomain('appointments');
        });

        test('should return supported intents with metadata', () => {
            const intents = genericOrchestrator.getSupportedIntents();
            expect(intents).toBeDefined();
            expect(Array.isArray(intents)).toBe(true);
            expect(intents.length).toBeGreaterThan(0);
            
            const greetIntent = intents.find(intent => intent.name === 'greet');
            expect(greetIntent).toBeDefined();
            expect(greetIntent.description).toBeDefined();
            expect(greetIntent.examples).toBeDefined();
        });

        test('should indicate which intents have slot extraction', () => {
            const intents = genericOrchestrator.getSupportedIntents();
            
            const scheduleIntent = intents.find(intent => intent.name === 'schedule_appointment');
            const greetIntent = intents.find(intent => intent.name === 'greet');
            
            expect(scheduleIntent?.hasSlotExtraction).toBe(true);
            expect(greetIntent?.hasSlotExtraction).toBe(false);
        });
    });

    describe('Orchestrator Status and Health', () => {
        test('should indicate readiness correctly', () => {
            const status = genericOrchestrator.getStatus();
            expect(typeof status.ready).toBe('boolean');
            expect(status.ready).toBe(true);
        });

        test('should track loaded domains', () => {
            const status = genericOrchestrator.getStatus();
            expect(Array.isArray(status.loadedDomains)).toBe(true);
            expect(status.loadedDomains.length).toBeGreaterThan(0);
        });

        test('should provide meaningful status information', () => {
            const status = genericOrchestrator.getStatus();
            expect(status.currentDomain).toBeDefined();
            expect(status.supportedIntents).toBeGreaterThan(0);
        });
    });
}); 