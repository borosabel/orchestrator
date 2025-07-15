import { genericIntentDetector } from '../../src/core/genericIntentDetector';
import { configLoader } from '../../src/config/configLoader';
import { appointmentDomainConfig } from '../../src/domains/appointments.config';

describe('Generic Intent Detection Module', () => {
    beforeAll(async () => {
        // Load the appointments domain configuration
        await configLoader.loadConfig(appointmentDomainConfig);
        const config = configLoader.getCurrentConfig();
        if (config) {
            await genericIntentDetector.initialize(config);
        }
    });

    afterAll(() => {
        // Clean up
        genericIntentDetector.reset();
    });

    describe('detectIntent function (generic LangChain)', () => {
        test('should detect greet intent', async () => {
            expect(await genericIntentDetector.detectIntent('hello')).toBe('greet');
            expect(await genericIntentDetector.detectIntent('hi')).toBe('greet');
            expect(await genericIntentDetector.detectIntent('good morning')).toBe('greet');
        }, 15000);

        test('should detect schedule_appointment intent', async () => {
            expect(await genericIntentDetector.detectIntent('I need to schedule an appointment')).toBe('schedule_appointment');
            expect(await genericIntentDetector.detectIntent('Book me a meeting')).toBe('schedule_appointment');
            expect(await genericIntentDetector.detectIntent('I want to make an appointment')).toBe('schedule_appointment');
        }, 15000);

        test('should detect cancel_appointment intent', async () => {
            expect(await genericIntentDetector.detectIntent('Cancel my appointment')).toBe('cancel_appointment');
            expect(await genericIntentDetector.detectIntent('I want to cancel APT-123456')).toBe('cancel_appointment');
            expect(await genericIntentDetector.detectIntent('Remove my booking')).toBe('cancel_appointment');
        }, 15000);

        test('should detect check_availability intent', async () => {
            expect(await genericIntentDetector.detectIntent('What\'s available tomorrow?')).toBe('check_availability');
            expect(await genericIntentDetector.detectIntent('Check availability')).toBe('check_availability');
            expect(await genericIntentDetector.detectIntent('Any openings this week?')).toBe('check_availability');
        }, 15000);

        test('should detect exit intent', async () => {
            expect(await genericIntentDetector.detectIntent('bye')).toBe('exit');
            expect(await genericIntentDetector.detectIntent('exit')).toBe('exit');
            expect(await genericIntentDetector.detectIntent('goodbye')).toBe('exit');
        }, 15000);

        test('should return unknown for unrecognized input', async () => {
            expect(await genericIntentDetector.detectIntent('random text that makes no sense')).toBe('unknown');
            expect(await genericIntentDetector.detectIntent('xyz123')).toBe('unknown');
        }, 15000);

        test('should handle empty input gracefully', async () => {
            expect(await genericIntentDetector.detectIntent('')).toBe('unknown');
        }, 15000);
    });

    describe('intent detector utilities', () => {
        test('should return supported intents', () => {
            const supportedIntents = genericIntentDetector.getSupportedIntents();
            expect(supportedIntents).toContain('greet');
            expect(supportedIntents).toContain('schedule_appointment');
            expect(supportedIntents).toContain('cancel_appointment');
            expect(supportedIntents).toContain('check_availability');
            expect(supportedIntents).toContain('exit');
            expect(supportedIntents).toContain('unknown');
        });

        test('should check if intent is supported', () => {
            expect(genericIntentDetector.isIntentSupported('greet')).toBe(true);
            expect(genericIntentDetector.isIntentSupported('schedule_appointment')).toBe(true);
            expect(genericIntentDetector.isIntentSupported('nonexistent_intent')).toBe(false);
        });

        test('should get intent information', () => {
            const greetInfo = genericIntentDetector.getIntentInfo('greet');
            expect(greetInfo).toBeDefined();
            expect(greetInfo.name).toBe('greet');
            expect(greetInfo.description).toContain('Greeting');
        });
    });
});
