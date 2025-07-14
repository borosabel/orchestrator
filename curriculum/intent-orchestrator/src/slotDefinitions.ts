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
    greet: [], // No slots needed for greeting
    exit: [], // No slots needed for exit
    unknown: [] // No slots needed for unknown
}; 