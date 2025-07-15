export interface SlotDefinition {
    name: string;
    message: string;
    type: 'input' | 'list';
    choices?: string[];
    validate?: (input: string) => boolean | string;
}

export interface IntentSlots {
    [intentName: string]: SlotDefinition[];
}

export const slotDefinitions: IntentSlots = {
    loan_inquiry: [
        {
            name: 'amount',
            message: 'How much would you like to borrow?',
            type: 'input',
            validate: (input: string) => {
                const num = parseFloat(input);
                return !isNaN(num) && num > 0 || 'Please enter a valid positive number';
            }
        },
        {
            name: 'purpose',
            message: 'What do you need this loan for?',
            type: 'list',
            choices: [
                'Home purchase',
                'Car purchase', 
                'Business expansion',
                'Personal expenses',
                'Education',
                'Other'
            ]
        }
    ],
    schedule_appointment: [
        {
            name: 'date',
            message: 'What date would you like to schedule for?',
            type: 'input',
            validate: (input: string) => {
                // Basic validation - accept various date formats
                if (input.length > 0) return true;
                return 'Please enter a date (e.g., tomorrow, Monday, 2024-01-15)';
            }
        },
        {
            name: 'time',
            message: 'What time would you prefer?',
            type: 'input',
            validate: (input: string) => {
                // Basic validation - accept various time formats
                if (input.length > 0) return true;
                return 'Please enter a time (e.g., 2pm, 14:00, morning)';
            }
        },
        {
            name: 'service',
            message: 'What type of appointment is this?',
            type: 'list',
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
            validate: (input: string) => {
                // Basic validation for appointment ID format (APT-XXXXXX)
                const idPattern = /^APT-\d{6}$/i;
                if (idPattern.test(input.trim())) return true;
                return 'Please enter a valid confirmation ID (format: APT-123456)';
            }
        }
    ],
    greet: [], // No slots needed for greeting
    exit: [], // No slots needed for exit
    unknown: [] // No slots needed for unknown
}; 