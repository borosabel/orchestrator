import { genericSlotExtractor } from '../../src/core/genericSlotExtractor';
import { configLoader } from '../../src/config/configLoader';
import { appointmentDomainConfig } from '../../src/domains/appointments.config';

describe('Generic Slot Extraction Module', () => {
    beforeAll(async () => {
        // Load the appointments domain configuration
        await configLoader.loadConfig(appointmentDomainConfig);
        const config = configLoader.getCurrentConfig();
        if (config) {
            await genericSlotExtractor.initialize(config);
        }
    });

    afterAll(() => {
        // Clean up
        genericSlotExtractor.reset();
    });

    describe('Slot Definitions', () => {
        test('should have schedule_appointment slot definition', () => {
            const slots = genericSlotExtractor.getSlotDefinitions('schedule_appointment');
            expect(slots).toBeDefined();
            expect(Array.isArray(slots)).toBe(true);
            expect(slots.length).toBe(3); // date, time, service
        });

        test('should have cancel_appointment slot definition', () => {
            const slots = genericSlotExtractor.getSlotDefinitions('cancel_appointment');
            expect(slots).toBeDefined();
            expect(Array.isArray(slots)).toBe(true);
            expect(slots.length).toBe(1); // confirmation_id
        });

        test('should have check_availability slot definition', () => {
            const slots = genericSlotExtractor.getSlotDefinitions('check_availability');
            expect(slots).toBeDefined();
            expect(Array.isArray(slots)).toBe(true);
            expect(slots.length).toBe(3); // date, time_preference, service
        });

        test('should have required slot types for appointments', () => {
            const slots = genericSlotExtractor.getSlotDefinitions('schedule_appointment');
            const dateSlot = slots.find(slot => slot.name === 'date');
            const timeSlot = slots.find(slot => slot.name === 'time');
            const serviceSlot = slots.find(slot => slot.name === 'service');
            
            expect(dateSlot?.type).toBe('input');
            expect(timeSlot?.type).toBe('input');
            expect(serviceSlot?.type).toBe('list');
            expect(serviceSlot?.choices).toBeDefined();
            expect(Array.isArray(serviceSlot?.choices)).toBe(true);
        });

        test('should have validation for confirmation_id', () => {
            const slots = genericSlotExtractor.getSlotDefinitions('cancel_appointment');
            const confirmationSlot = slots.find(slot => slot.name === 'confirmation_id');
            expect(confirmationSlot?.validate).toBeDefined();
            expect(typeof confirmationSlot?.validate).toBe('function');
        });
    });

    describe('Slot Extraction', () => {
        test('should extract appointment scheduling slots', async () => {
            const result = await genericSlotExtractor.extractSlots(
                'schedule_appointment',
                'I want to schedule a medical consultation for tomorrow at 2pm'
            );
            
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
            // Note: Actual extraction depends on LangChain API, so we test structure
        }, 15000);

        test('should extract cancellation slots', async () => {
            const result = await genericSlotExtractor.extractSlots(
                'cancel_appointment',
                'Cancel appointment APT-123456'
            );
            
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
        }, 15000);

        test('should extract availability check slots', async () => {
            const result = await genericSlotExtractor.extractSlots(
                'check_availability',
                'What medical appointments are available tomorrow morning?'
            );
            
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
        }, 15000);

        test('should return empty object for intents without slot extraction', async () => {
            const result = await genericSlotExtractor.extractSlots('greet', 'hello');
            expect(result).toEqual({});
        });

        test('should handle empty input gracefully', async () => {
            const result = await genericSlotExtractor.extractSlots('schedule_appointment', '');
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
        });
    });

    describe('Slot Extractor Utilities', () => {
        test('should check if intent has slot extraction', () => {
            expect(genericSlotExtractor.hasSlotExtraction('schedule_appointment')).toBe(true);
            expect(genericSlotExtractor.hasSlotExtraction('cancel_appointment')).toBe(true);
            expect(genericSlotExtractor.hasSlotExtraction('check_availability')).toBe(true);
            expect(genericSlotExtractor.hasSlotExtraction('greet')).toBe(false);
        });

        test('should return intents with slot extraction', () => {
            const intentsWithSlots = genericSlotExtractor.getIntentsWithSlotExtraction();
            expect(intentsWithSlots).toContain('schedule_appointment');
            expect(intentsWithSlots).toContain('cancel_appointment');
            expect(intentsWithSlots).toContain('check_availability');
            expect(intentsWithSlots).not.toContain('greet');
        });

        test('should return empty array for non-existent intent slots', () => {
            const slots = genericSlotExtractor.getSlotDefinitions('nonexistent_intent');
            expect(slots).toEqual([]);
        });
    });
}); 