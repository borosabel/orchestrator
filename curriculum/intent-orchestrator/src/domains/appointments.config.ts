import { DomainConfig } from '../config/configSchema';
import { handleAppointmentScheduling } from '../skills/appointmentScheduling';
import { handleAppointmentCancellation } from '../skills/appointmentCancellation';
import { handleAvailabilityCheck } from '../skills/availabilityCheck';

/**
 * Appointment Management Domain Configuration
 * 
 * This configuration defines a complete appointment booking system with:
 * - Scheduling new appointments
 * - Canceling existing appointments  
 * - Checking availability
 * - Basic conversation handling
 */
export const appointmentDomainConfig: DomainConfig = {
    metadata: {
        name: "appointments",
        version: "1.0.0",
        description: "Complete appointment management system for booking, canceling, and checking availability",
        author: "Orchestrator Framework",
        created: "2024-01-01"
    },

    intents: [
        {
            name: 'greet',
            patterns: [/hello/i, /hi/i, /hey/i, /good morning/i, /good afternoon/i],
            description: 'Greeting and welcome messages',
            skillHandler: 'greet',
            slots: [],
            examples: ['Hello', 'Hi there', 'Good morning']
        },
        {
            name: 'schedule_appointment',
            patterns: [/appointment/i, /schedule/i, /book/i, /reserve/i, /meeting/i],
            description: 'Requests to book, schedule, or arrange appointments or meetings',
            skillHandler: 'schedule_appointment',
            slots: ['date', 'time', 'service'],
            examples: [
                'I need to schedule an appointment',
                'Book me a meeting for tomorrow',
                'Can I schedule a consultation?'
            ]
        },
        {
            name: 'cancel_appointment',
            patterns: [/cancel/i, /delete/i, /remove/i, /unbook/i],
            description: 'Requests to cancel, delete, or remove existing appointments',
            skillHandler: 'cancel_appointment',
            slots: ['confirmation_id'],
            examples: [
                'Cancel my appointment',
                'I want to cancel APT-123456',
                'Remove my booking please'
            ]
        },
        {
            name: 'check_availability',
            patterns: [/available/i, /availability/i, /free/i, /open/i, /slots/i],
            description: 'Requests to check available time slots, see what\'s open, or inquire about availability',
            skillHandler: 'check_availability',
            slots: ['date', 'time_preference', 'service'],
            examples: [
                'What\'s available tomorrow?',
                'Check availability for medical appointments',
                'Any openings this week?'
            ]
        },
        {
            name: 'exit',
            patterns: [/bye/i, /exit/i, /quit/i, /goodbye/i, /see you/i],
            description: 'Goodbyes, exit requests, ending conversation',
            skillHandler: 'exit',
            slots: [],
            examples: ['Bye', 'Goodbye', 'See you later']
        },
        {
            name: 'unknown',
            patterns: [/.*/],
            description: 'Fallback for unrecognized inputs',
            skillHandler: 'unknown',
            slots: [],
            examples: []
        }
    ],

    slots: {
        schedule_appointment: [
            {
                name: 'date',
                message: 'What date would you like to schedule for?',
                type: 'input',
                required: true,
                description: 'Preferred date for the appointment',
                validate: (input: string) => {
                    if (input.length > 0) return true;
                    return 'Please enter a date (e.g., tomorrow, Monday, 2024-01-15)';
                }
            },
            {
                name: 'time',
                message: 'What time would you prefer?',
                type: 'input',
                required: true,
                description: 'Preferred time for the appointment',
                validate: (input: string) => {
                    if (input.length > 0) return true;
                    return 'Please enter a time (e.g., 2pm, 14:00, morning)';
                }
            },
            {
                name: 'service',
                message: 'What type of appointment is this?',
                type: 'list',
                required: true,
                description: 'Type of service needed',
                choices: [
                    'Medical consultation',
                    'Business meeting',
                    'Personal consultation',
                    'Technical support',
                    'Other'
                ]
            }
        ],

        cancel_appointment: [
            {
                name: 'confirmation_id',
                message: 'What is your appointment confirmation ID?',
                type: 'input',
                required: true,
                description: 'Appointment confirmation ID in format APT-XXXXXX',
                validate: (input: string) => {
                    const idPattern = /^APT-\d{6}$/i;
                    if (idPattern.test(input.trim())) return true;
                    return 'Please enter a valid confirmation ID (format: APT-123456)';
                }
            }
        ],

        check_availability: [
            {
                name: 'date',
                message: 'What date would you like to check availability for?',
                type: 'input',
                required: false,
                description: 'Date to check availability (optional)',
                validate: (_input: string) => true // Accept any input for date
            },
            {
                name: 'time_preference',
                message: 'Do you have a preferred time of day?',
                type: 'list',
                required: false,
                description: 'Preferred time of day (optional)',
                choices: [
                    'Morning (9am-12pm)',
                    'Afternoon (12pm-5pm)',
                    'Evening (5pm-8pm)',
                    'Any time'
                ]
            },
            {
                name: 'service',
                message: 'What type of appointment are you looking for?',
                type: 'list',
                required: false,
                description: 'Type of service needed (optional)',
                choices: [
                    'Medical consultation',
                    'Business meeting',
                    'Personal consultation',
                    'Technical support',
                    'Any service'
                ]
            }
        ],

        greet: [],
        exit: [],
        unknown: []
    },

    prompts: {
        intentDetection: `
You are an intent classifier for an appointment management system.
Classify the user's message into one of these categories:

- greet: Greetings, hellos, introductions
- schedule_appointment: Requests to book, schedule, or arrange appointments or meetings
- cancel_appointment: Requests to cancel, delete, or remove existing appointments
- check_availability: Requests to check available time slots, see what's open, or inquire about availability
- exit: Goodbyes, exit requests, ending conversation
- unknown: Anything else that doesn't fit the above categories

User message: "{text}"

Respond with ONLY the intent name (greet, schedule_appointment, cancel_appointment, check_availability, exit, or unknown).
        `,

        slotExtraction: {
            schedule_appointment: `
You are an information extraction system for appointment scheduling.
Extract the date, time, and service type from the user's message.

Valid service types are:
- Medical consultation
- Business meeting
- Personal consultation
- Technical support
- Other

User message: "{text}"

Extract the information and respond in JSON format:
{{
  "date": "extracted_date_as_mentioned",
  "time": "extracted_time_as_mentioned", 
  "service": "exact_service_from_valid_list_or_Other"
}}

Rules:
- For date: Extract as mentioned (e.g., "tomorrow", "Monday", "Jan 15", "next week")
- For time: Extract as mentioned (e.g., "2pm", "14:00", "morning", "afternoon")
- For service: Use exact match from valid service types, or "Other" if unclear
- If information is not found, omit that field from the JSON
- Respond with valid JSON only, no other text
            `,

            cancel_appointment: `
You are an information extraction system for appointment cancellation.
Extract the confirmation ID from the user's message.

User message: "{text}"

Extract the information and respond in JSON format:
{{
  "confirmation_id": "extracted_confirmation_id"
}}

Rules:
- Look for appointment confirmation IDs in format APT-XXXXXX (where X is a digit)
- Extract the ID exactly as mentioned, preserving the APT- prefix
- If no confirmation ID is found, omit the field from the JSON
- Respond with valid JSON only, no other text
            `,

            check_availability: `
You are an information extraction system for availability checking.
Extract the date, time preference, and service type from the user's message.

Valid time preferences are:
- Morning (9am-12pm)
- Afternoon (12pm-5pm)
- Evening (5pm-8pm)
- Any time

Valid service types are:
- Medical consultation
- Business meeting
- Personal consultation
- Technical support
- Any service

User message: "{text}"

Extract the information and respond in JSON format:
{{
  "date": "extracted_date_as_mentioned",
  "time_preference": "exact_time_preference_from_valid_list",
  "service": "exact_service_from_valid_list"
}}

Rules:
- For date: Extract as mentioned (e.g., "tomorrow", "Monday", "Jan 15", "this week")
- For time_preference: Map to exact match from valid time preferences, or omit if unclear
- For service: Use exact match from valid service types, or "Any service" if not specified
- If information is not found, omit that field from the JSON
- Respond with valid JSON only, no other text
            `
        }
    },

    skills: {
        greet: async (_extractedSlots: Record<string, any> = {}) => {
            return "Hello! 👋 Welcome to our appointment booking system. I can help you schedule appointments, check availability, or cancel existing bookings. How can I assist you today?";
        },
        schedule_appointment: handleAppointmentScheduling,
        cancel_appointment: handleAppointmentCancellation,
        check_availability: handleAvailabilityCheck,
        exit: async (_extractedSlots: Record<string, any> = {}) => {
            return "Goodbye! 👋 Thank you for using our appointment system. Have a great day!";
        },
        unknown: async (_extractedSlots: Record<string, any> = {}) => {
            return "I'm sorry, I didn't understand that. I can help you with:\n• Scheduling appointments\n• Checking availability\n• Canceling appointments\n\nWhat would you like to do?";
        }
    },

    options: {
        fallbackIntent: 'unknown',
        maxSlotRetries: 3,
        enableConversationMemory: true,
        modelConfig: {
            model: 'gpt-3.5-turbo',
            temperature: 0.1,
            maxTokens: 200
        }
    }
}; 