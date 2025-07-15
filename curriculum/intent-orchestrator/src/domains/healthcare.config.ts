import { DomainConfig } from '../config/configSchema';

/**
 * Healthcare Services Domain Configuration
 * 
 * This configuration defines a healthcare patient portal system with:
 * - Appointment scheduling
 * - Symptom checker
 * - Prescription refills
 * - Medical record access
 */
export const healthcareDomainConfig: DomainConfig = {
    metadata: {
        name: "healthcare",
        version: "1.0.0",
        description: "Healthcare patient portal for appointments, symptoms, and medical services",
        author: "HealthTech Solutions",
        created: "2024-01-01"
    },

    intents: [
        {
            name: 'greet',
            patterns: [/hello/i, /hi/i, /good morning/i, /welcome/i],
            description: 'Patient greetings and welcome messages',
            skillHandler: 'greet',
            slots: [],
            examples: ['Hello', 'Good morning', 'Hi doctor']
        },
        {
            name: 'schedule_appointment',
            patterns: [/appointment/i, /schedule/i, /book/i, /visit/i, /see doctor/i],
            description: 'Requests to schedule medical appointments',
            skillHandler: 'schedule_appointment',
            slots: ['specialty', 'urgency', 'date_preference'],
            examples: [
                'I need to see a doctor',
                'Schedule an appointment with cardiology',
                'Book me a visit next week'
            ]
        },
        {
            name: 'symptom_check',
            patterns: [/symptoms/i, /feeling/i, /pain/i, /sick/i, /hurt/i],
            description: 'Symptom checking and basic triage',
            skillHandler: 'symptom_check',
            slots: ['symptoms', 'duration', 'severity'],
            examples: [
                'I have a headache',
                'My stomach hurts',
                'I\'ve been feeling tired lately'
            ]
        },
        {
            name: 'prescription_refill',
            patterns: [/prescription/i, /refill/i, /medication/i, /pills/i, /medicine/i],
            description: 'Requests for prescription refills',
            skillHandler: 'prescription_refill',
            slots: ['medication_name', 'pharmacy'],
            examples: [
                'I need a refill',
                'Refill my blood pressure medication',
                'My prescription is running low'
            ]
        },
        {
            name: 'medical_records',
            patterns: [/records/i, /results/i, /lab/i, /test/i, /report/i],
            description: 'Requests for medical records and test results',
            skillHandler: 'medical_records',
            slots: ['record_type', 'date_range'],
            examples: [
                'Show my lab results',
                'I need my medical records',
                'When will my test results be ready?'
            ]
        },
        {
            name: 'exit',
            patterns: [/bye/i, /goodbye/i, /thank you/i, /thanks/i],
            description: 'Patient goodbye and conversation ending',
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
        schedule_appointment: [
            {
                name: 'specialty',
                message: 'What type of doctor would you like to see?',
                type: 'list',
                required: true,
                description: 'Medical specialty needed',
                choices: [
                    'General Practice',
                    'Cardiology',
                    'Dermatology',
                    'Orthopedics',
                    'Gynecology',
                    'Pediatrics',
                    'Mental Health',
                    'Other'
                ]
            },
            {
                name: 'urgency',
                message: 'How urgent is this appointment?',
                type: 'list',
                required: true,
                description: 'Urgency level of the appointment',
                choices: [
                    'Emergency (same day)',
                    'Urgent (within 3 days)',
                    'Routine (within 2 weeks)',
                    'Follow-up (flexible timing)'
                ]
            },
            {
                name: 'date_preference',
                message: 'Do you have a preferred date or time?',
                type: 'input',
                required: false,
                description: 'Preferred date/time for appointment',
                validate: (_input: string) => true
            }
        ],

        symptom_check: [
            {
                name: 'symptoms',
                message: 'Please describe your symptoms',
                type: 'input',
                required: true,
                description: 'Patient symptoms description',
                validate: (input: string) => {
                    if (input.length >= 10) return true;
                    return 'Please provide more detailed symptom description (at least 10 characters)';
                }
            },
            {
                name: 'duration',
                message: 'How long have you been experiencing these symptoms?',
                type: 'list',
                required: true,
                description: 'Duration of symptoms',
                choices: [
                    'Less than 24 hours',
                    '1-3 days',
                    '1 week',
                    '2-4 weeks',
                    'More than a month'
                ]
            },
            {
                name: 'severity',
                message: 'How would you rate the severity? (1-10)',
                type: 'input',
                required: true,
                description: 'Symptom severity rating',
                validate: (input: string) => {
                    const num = parseInt(input);
                    if (num >= 1 && num <= 10) return true;
                    return 'Please enter a number between 1 and 10';
                }
            }
        ],

        prescription_refill: [
            {
                name: 'medication_name',
                message: 'What medication do you need refilled?',
                type: 'input',
                required: true,
                description: 'Name of medication to refill',
                validate: (input: string) => {
                    if (input.length >= 3) return true;
                    return 'Please enter the medication name (at least 3 characters)';
                }
            },
            {
                name: 'pharmacy',
                message: 'Which pharmacy would you like to use?',
                type: 'list',
                required: false,
                description: 'Preferred pharmacy for pickup',
                choices: [
                    'CVS Pharmacy',
                    'Walgreens',
                    'Rite Aid',
                    'Local Pharmacy',
                    'Mail Order',
                    'Other'
                ]
            }
        ],

        medical_records: [
            {
                name: 'record_type',
                message: 'What type of records do you need?',
                type: 'list',
                required: true,
                description: 'Type of medical records requested',
                choices: [
                    'Lab results',
                    'X-ray/Imaging',
                    'Prescription history',
                    'Visit summaries',
                    'Vaccination records',
                    'All records'
                ]
            },
            {
                name: 'date_range',
                message: 'What time period are you interested in?',
                type: 'list',
                required: false,
                description: 'Date range for medical records',
                choices: [
                    'Last 30 days',
                    'Last 3 months',
                    'Last 6 months',
                    'Last year',
                    'All available'
                ]
            }
        ],

        greet: [],
        exit: [],
        unknown: []
    },

    prompts: {
        intentDetection: `
You are an intent classifier for a healthcare patient portal system.
Classify the user's message into one of these categories:

- greet: Patient greetings and welcome messages
- schedule_appointment: Requests to schedule medical appointments
- symptom_check: Symptom checking and basic triage
- prescription_refill: Requests for prescription refills
- medical_records: Requests for medical records and test results
- exit: Patient goodbye and conversation ending
- unknown: Anything else that doesn't fit the above categories

User message: "{text}"

Respond with ONLY the intent name (greet, schedule_appointment, symptom_check, prescription_refill, medical_records, exit, or unknown).
        `,

        slotExtraction: {
            schedule_appointment: `
You are an information extraction system for medical appointment scheduling.
Extract the specialty, urgency, and date preference from the user's message.

Valid specialties are:
- General Practice
- Cardiology
- Dermatology
- Orthopedics
- Gynecology
- Pediatrics
- Mental Health
- Other

Valid urgency levels are:
- Emergency (same day)
- Urgent (within 3 days)
- Routine (within 2 weeks)
- Follow-up (flexible timing)

User message: "{text}"

Extract the information and respond in JSON format:
{{
  "specialty": "exact_specialty_from_valid_list",
  "urgency": "exact_urgency_from_valid_list",
  "date_preference": "any_mentioned_date_or_time"
}}

Rules:
- For specialty: Use exact match from valid specialties, or "Other" if unclear
- For urgency: Infer from context (emergency words → Emergency, ASAP → Urgent, etc.)
- For date_preference: Extract any mentioned dates/times as-is
- If information is not found, omit that field from the JSON
- Respond with valid JSON only, no other text
            `,

            symptom_check: `
You are an information extraction system for symptom assessment.
Extract symptoms, duration, and severity from the user's message.

Valid duration options are:
- Less than 24 hours
- 1-3 days
- 1 week
- 2-4 weeks
- More than a month

User message: "{text}"

Extract the information and respond in JSON format:
{{
  "symptoms": "detailed_symptom_description",
  "duration": "exact_duration_from_valid_list",
  "severity": "number_from_1_to_10"
}}

Rules:
- For symptoms: Extract full description as mentioned
- For duration: Map to closest valid duration option
- For severity: Look for numbers 1-10 or words like "mild" (3), "moderate" (5), "severe" (8)
- If information is not found, omit that field from the JSON
- Respond with valid JSON only, no other text
            `,

            prescription_refill: `
You are an information extraction system for prescription refills.
Extract medication name and pharmacy from the user's message.

Valid pharmacies are:
- CVS Pharmacy
- Walgreens
- Rite Aid
- Local Pharmacy
- Mail Order
- Other

User message: "{text}"

Extract the information and respond in JSON format:
{{
  "medication_name": "name_of_medication",
  "pharmacy": "exact_pharmacy_from_valid_list"
}}

Rules:
- For medication_name: Extract the specific medication mentioned
- For pharmacy: Use exact match from valid pharmacies, or "Other" if unclear
- If information is not found, omit that field from the JSON
- Respond with valid JSON only, no other text
            `,

            medical_records: `
You are an information extraction system for medical record requests.
Extract record type and date range from the user's message.

Valid record types are:
- Lab results
- X-ray/Imaging
- Prescription history
- Visit summaries
- Vaccination records
- All records

Valid date ranges are:
- Last 30 days
- Last 3 months
- Last 6 months
- Last year
- All available

User message: "{text}"

Extract the information and respond in JSON format:
{{
  "record_type": "exact_record_type_from_valid_list",
  "date_range": "exact_date_range_from_valid_list"
}}

Rules:
- For record_type: Use exact match from valid record types
- For date_range: Use exact match from valid date ranges
- If information is not found, omit that field from the JSON
- Respond with valid JSON only, no other text
            `
        }
    },

    skills: {
        greet: async (_extractedSlots: Record<string, any> = {}) => {
            return "Welcome to HealthPortal! 🏥 I'm your healthcare assistant. I can help you schedule appointments, check symptoms, refill prescriptions, and access your medical records. How can I assist you today?";
        },

        schedule_appointment: async (extractedSlots: Record<string, any> = {}) => {
            const specialty = extractedSlots.specialty || 'General Practice';
            const urgency = extractedSlots.urgency || 'Routine (within 2 weeks)';
            
            return `📅 **Appointment Scheduling**

🏥 **Specialty:** ${specialty}
⚡ **Urgency:** ${urgency}

✅ **Next Steps:**
• We're checking availability for ${specialty}
• Based on urgency level, we'll find the best time slot
• You'll receive confirmation via email and SMS

🔔 **Important Notes:**
• Emergency cases: Please call 911 or visit ER
• Urgent symptoms: Our on-call nurse will contact you
• Routine appointments: You'll hear back within 24 hours

📞 Need immediate assistance? Call our 24/7 nurse line: 1-800-HEALTH`;
        },

        symptom_check: async (extractedSlots: Record<string, any> = {}) => {
            const symptoms = extractedSlots.symptoms || 'general discomfort';
            const severity = extractedSlots.severity || '5';
            
            const severityNum = parseInt(severity);
            let recommendation = '';
            
            if (severityNum >= 8) {
                recommendation = '🚨 **High Priority** - Consider seeking immediate medical attention';
            } else if (severityNum >= 5) {
                recommendation = '⚠️ **Moderate Priority** - Schedule an appointment within a few days';
            } else {
                recommendation = '💚 **Low Priority** - Monitor symptoms and consider routine check-up';
            }

            return `🩺 **Symptom Assessment**

📝 **Symptoms:** ${symptoms}
📊 **Severity Level:** ${severity}/10

${recommendation}

💡 **General Recommendations:**
• Stay hydrated and get adequate rest
• Monitor symptoms for any changes
• Keep a symptom diary if helpful
• Don't hesitate to call if symptoms worsen

⚠️ **Seek immediate care if you experience:**
• Severe chest pain or difficulty breathing
• Signs of stroke (FAST test)
• Severe allergic reactions
• High fever with confusion

📞 24/7 Nurse Line: 1-800-HEALTH`;
        },

        prescription_refill: async (extractedSlots: Record<string, any> = {}) => {
            const medication = extractedSlots.medication_name || 'your prescription';
            const pharmacy = extractedSlots.pharmacy || 'your preferred pharmacy';

            return `💊 **Prescription Refill Request**

🏷️ **Medication:** ${medication}
🏪 **Pharmacy:** ${pharmacy}

✅ **Processing Your Request:**
• Checking your prescription history
• Verifying remaining refills with doctor
• Coordinating with ${pharmacy}

⏰ **Timeline:**
• Routine refills: Ready in 2-4 hours
• Doctor approval needed: 24-48 hours
• You'll get SMS notification when ready

📋 **Important Reminders:**
• Pick up within 10 days of notification
• Bring valid ID for controlled substances
• Check with pharmacist about drug interactions

📞 Questions? Call our pharmacy line: 1-800-MEDS-NOW`;
        },

        medical_records: async (extractedSlots: Record<string, any> = {}) => {
            const recordType = extractedSlots.record_type || 'medical records';
            const dateRange = extractedSlots.date_range || 'recent';

            return `📋 **Medical Records Access**

📁 **Record Type:** ${recordType}
📅 **Time Period:** ${dateRange}

🔍 **Retrieving Your Records:**
• Searching our secure database
• Compiling ${recordType} for ${dateRange}
• Preparing secure download link

🔒 **Privacy & Security:**
• All records are HIPAA-compliant
• Secure encrypted transmission
• Access logs maintained for your protection

📧 **Delivery Options:**
• Secure patient portal (recommended)
• Encrypted email to verified address
• Physical pickup with valid ID

⏱️ **Processing Time:** 1-3 business days
📞 Questions about records: 1-800-RECORDS`;
        },

        exit: async (_extractedSlots: Record<string, any> = {}) => {
            return "Thank you for using HealthPortal! 🏥 Take care of yourself and remember - we're here 24/7 for all your healthcare needs. Feel better soon! 💙";
        },

        unknown: async (_extractedSlots: Record<string, any> = {}) => {
            return "I'm sorry, I didn't understand that request. As your healthcare assistant, I can help you with:\n\n📅 Scheduling appointments\n🩺 Symptom checking\n💊 Prescription refills\n📋 Medical records access\n\nWhat would you like help with today?";
        }
    },

    options: {
        fallbackIntent: 'unknown',
        maxSlotRetries: 3,
        enableConversationMemory: true,
        modelConfig: {
            model: 'gpt-3.5-turbo',
            temperature: 0.1,
            maxTokens: 300
        }
    }
}; 