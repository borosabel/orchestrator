import { DomainConfig } from '../config/configSchema';
import { handleLoanInquiry } from '../skills/loanInquiry';

/**
 * Banking Services Domain Configuration
 * 
 * This configuration defines a banking customer service system with:
 * - Loan inquiries and applications
 * - Account balance checks
 * - Transaction history
 * - Basic customer support
 */
export const bankingDomainConfig: DomainConfig = {
    metadata: {
        name: "banking",
        version: "1.0.0", 
        description: "Banking services system for loans, accounts, and customer support",
        author: "Banking Solutions Team",
        created: "2024-01-01"
    },

    intents: [
        {
            name: 'greet',
            patterns: [/hello/i, /hi/i, /good morning/i, /welcome/i],
            description: 'Customer greetings and welcome messages',
            skillHandler: 'greet',
            slots: [],
            examples: ['Hello', 'Good morning', 'Hi there']
        },
        {
            name: 'loan_inquiry',
            patterns: [/loan/i, /borrow/i, /credit/i, /financing/i, /mortgage/i],
            description: 'Questions about loans, borrowing money, financial assistance',
            skillHandler: 'loan_inquiry',
            slots: ['amount', 'purpose'],
            examples: [
                'I need a loan',
                'Can I borrow money for a car?',
                'What are your mortgage rates?'
            ]
        },
        {
            name: 'balance_check',
            patterns: [/balance/i, /account/i, /money/i, /funds/i],
            description: 'Requests to check account balance or account information',
            skillHandler: 'balance_check',
            slots: ['account_type'],
            examples: [
                'What\'s my balance?',
                'Check my savings account',
                'How much money do I have?'
            ]
        },
        {
            name: 'transaction_history',
            patterns: [/transactions/i, /history/i, /statement/i, /activity/i],
            description: 'Requests for transaction history or account statements',
            skillHandler: 'transaction_history',
            slots: ['account_type', 'time_period'],
            examples: [
                'Show my recent transactions',
                'I need my statement',
                'What transactions happened last month?'
            ]
        },
        {
            name: 'exit',
            patterns: [/bye/i, /goodbye/i, /thank you/i, /thanks/i],
            description: 'Customer goodbye and conversation ending',
            skillHandler: 'exit',
            slots: [],
            examples: ['Goodbye', 'Thanks for your help', 'Bye']
        },
        {
            name: 'unknown',
            patterns: [/.*/],
            description: 'Fallback for unrecognized requests',
            skillHandler: 'unknown',
            slots: [],
            examples: []
        }
    ],

    slots: {
        loan_inquiry: [
            {
                name: 'amount',
                message: 'How much would you like to borrow?',
                type: 'input',
                required: true,
                description: 'Loan amount requested',
                validate: (input: string) => {
                    const num = parseFloat(input.replace(/[,$]/g, ''));
                    return !isNaN(num) && num > 0 || 'Please enter a valid positive amount';
                }
            },
            {
                name: 'purpose',
                message: 'What do you need this loan for?',
                type: 'list',
                required: true,
                description: 'Purpose of the loan',
                choices: [
                    'Home purchase',
                    'Car purchase',
                    'Business expansion',
                    'Personal expenses',
                    'Education',
                    'Debt consolidation',
                    'Other'
                ]
            }
        ],

        balance_check: [
            {
                name: 'account_type',
                message: 'Which account would you like to check?',
                type: 'list',
                required: false,
                description: 'Type of account to check',
                choices: [
                    'Checking account',
                    'Savings account',
                    'Credit card',
                    'All accounts'
                ]
            }
        ],

        transaction_history: [
            {
                name: 'account_type',
                message: 'Which account\'s transactions would you like to see?',
                type: 'list',
                required: false,
                description: 'Account type for transaction history',
                choices: [
                    'Checking account',
                    'Savings account',
                    'Credit card',
                    'All accounts'
                ]
            },
            {
                name: 'time_period',
                message: 'What time period are you interested in?',
                type: 'list',
                required: false,
                description: 'Time period for transaction history',
                choices: [
                    'Last 7 days',
                    'Last 30 days',
                    'Last 3 months',
                    'Last 6 months',
                    'This year'
                ]
            }
        ],

        greet: [],
        exit: [],
        unknown: []
    },

    prompts: {
        intentDetection: `
You are an intent classifier for a banking customer service system.
Classify the user's message into one of these categories:

- greet: Customer greetings and welcome messages
- loan_inquiry: Questions about loans, borrowing money, financial assistance
- balance_check: Requests to check account balance or account information
- transaction_history: Requests for transaction history or account statements
- exit: Customer goodbye and conversation ending
- unknown: Anything else that doesn't fit the above categories

User message: "{text}"

Respond with ONLY the intent name (greet, loan_inquiry, balance_check, transaction_history, exit, or unknown).
        `,

        slotExtraction: {
            loan_inquiry: `
You are an information extraction system for loan applications.
Extract the loan amount and purpose from the user's message.

Valid loan purposes are:
- Home purchase
- Car purchase
- Business expansion
- Personal expenses
- Education
- Debt consolidation
- Other

User message: "{text}"

Extract the information and respond in JSON format:
{{
  "amount": "numeric_value_without_commas_or_currency_symbols",
  "purpose": "exact_purpose_from_valid_list_or_Other"
}}

Rules:
- For amount: Extract only the numeric value (e.g., "50000" not "$50,000")
- For purpose: Use exact match from valid purposes list, or "Other" if unclear
- If information is not found, omit that field from the JSON
- Respond with valid JSON only, no other text
            `,

            balance_check: `
You are an information extraction system for balance inquiries.
Extract the account type from the user's message.

Valid account types are:
- Checking account
- Savings account
- Credit card
- All accounts

User message: "{text}"

Extract the information and respond in JSON format:
{{
  "account_type": "exact_account_type_from_valid_list"
}}

Rules:
- For account_type: Use exact match from valid account types, or omit if unclear
- If information is not found, omit that field from the JSON
- Respond with valid JSON only, no other text
            `,

            transaction_history: `
You are an information extraction system for transaction history requests.
Extract the account type and time period from the user's message.

Valid account types are:
- Checking account
- Savings account
- Credit card
- All accounts

Valid time periods are:
- Last 7 days
- Last 30 days
- Last 3 months
- Last 6 months
- This year

User message: "{text}"

Extract the information and respond in JSON format:
{{
  "account_type": "exact_account_type_from_valid_list",
  "time_period": "exact_time_period_from_valid_list"
}}

Rules:
- For account_type: Use exact match from valid account types, or omit if unclear
- For time_period: Use exact match from valid time periods, or omit if unclear
- If information is not found, omit that field from the JSON
- Respond with valid JSON only, no other text
            `
        }
    },

    skills: {
        greet: async (_extractedSlots: Record<string, any> = {}) => {
            return "Welcome to SecureBank! 🏦 I'm here to help you with your banking needs. I can assist with loan inquiries, balance checks, transaction history, and more. How can I help you today?";
        },
        
        loan_inquiry: handleLoanInquiry,
        
        balance_check: async (extractedSlots: Record<string, any> = {}) => {
            const accountType = extractedSlots.account_type || 'All accounts';
            
            // Simulate balance lookup
            const balances = {
                'Checking account': '$2,543.67',
                'Savings account': '$15,230.42',
                'Credit card': '$1,250.00 available credit',
                'All accounts': 'Checking: $2,543.67 | Savings: $15,230.42 | Credit: $1,250.00 available'
            };

            return `💰 **Account Balance Information**

📊 **${accountType}:** ${balances[accountType as keyof typeof balances] || balances['All accounts']}

✅ All balances are current as of today
🔒 Your account information is secure and encrypted
📱 Download our mobile app for 24/7 account access

Need anything else? I can help with loans, transactions, or other banking services.`;
        },

        transaction_history: async (extractedSlots: Record<string, any> = {}) => {
            const accountType = extractedSlots.account_type || 'All accounts';
            const timePeriod = extractedSlots.time_period || 'Last 30 days';

            return `📋 **Transaction History**

🏦 **Account:** ${accountType}
📅 **Period:** ${timePeriod}

**Recent Transactions:**
• 01/15 - Direct Deposit - +$3,200.00
• 01/14 - Coffee Shop - -$4.85
• 01/13 - Gas Station - -$52.40
• 01/12 - Online Purchase - -$29.99
• 01/11 - ATM Withdrawal - -$100.00

💡 **Summary:** 5 transactions totaling $3,012.76 net increase

📄 For detailed statements, visit our website or mobile app
🔒 All transaction data is secured with bank-level encryption

Need help with anything else?`;
        },

        exit: async (_extractedSlots: Record<string, any> = {}) => {
            return "Thank you for banking with SecureBank! 🏦 Have a wonderful day and remember - we're here 24/7 for all your banking needs. Goodbye! 👋";
        },

        unknown: async (_extractedSlots: Record<string, any> = {}) => {
            return "I'm sorry, I didn't understand that request. As your banking assistant, I can help you with:\n\n💰 Loan inquiries and applications\n📊 Account balance checks\n📋 Transaction history\n🏦 General banking questions\n\nWhat would you like to help you with today?";
        }
    },

    options: {
        fallbackIntent: 'unknown',
        maxSlotRetries: 3,
        enableConversationMemory: true,
        modelConfig: {
            model: 'gpt-3.5-turbo',
            temperature: 0.1,
            maxTokens: 250
        }
    }
}; 