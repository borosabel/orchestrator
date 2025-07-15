import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI model
const model = new ChatOpenAI({
    modelName: process.env.DEFAULT_MODEL || "gpt-3.5-turbo",
    temperature: parseFloat(process.env.DEFAULT_TEMPERATURE || "0.1"),
    maxTokens: parseInt(process.env.DEFAULT_MAX_TOKENS || "200"),
});

// Define slot extraction prompt for loan inquiry
const loanSlotPrompt = PromptTemplate.fromTemplate(`
You are an information extraction system for loan applications. 
Extract the loan amount and purpose from the user's message.

Valid loan purposes are:
- Home purchase
- Car purchase
- Business expansion
- Personal expenses
- Education
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

Examples:
"I need $25000 for a car" → {{"amount": "25000", "purpose": "Car purchase"}}
"fifty thousand for home" → {{"amount": "50000", "purpose": "Home purchase"}}
"loan for business" → {{"purpose": "Business expansion"}}
`);

// Define slot extraction prompt for appointment scheduling
const appointmentSlotPrompt = PromptTemplate.fromTemplate(`
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

Examples:
"Schedule meeting for tomorrow at 2pm" → {{"date": "tomorrow", "time": "2pm", "service": "Business meeting"}}
"Need doctor appointment next Monday" → {{"date": "next Monday", "service": "Medical consultation"}}
"Book me something for Friday morning" → {{"date": "Friday", "time": "morning"}}
`);

export async function extractSlotsWithLangChain(intentName: string, userInput: string): Promise<Record<string, any>> {
    try {
        // Handle different intents
        if (intentName === 'loan_inquiry') {
            return await extractLoanSlots(userInput);
        } else if (intentName === 'schedule_appointment') {
            return await extractAppointmentSlots(userInput);
        } else {
            return {}; // No slot extraction for other intents
        }
        
    } catch (error) {
        console.error('Error in LangChain slot extraction:', error);
        return {}; // Return empty on error
    }
}

// Extract loan-specific slots
async function extractLoanSlots(userInput: string): Promise<Record<string, any>> {
    // Format the prompt with user input
    const formattedPrompt = await loanSlotPrompt.format({ text: userInput });
    
    // Get response from OpenAI
    const response = await model.invoke(formattedPrompt);
    
    // Parse JSON response
    const content = response.content.toString().trim();
    
    // Extract JSON from response (in case there's extra text)
    const jsonMatch = content.match(/\{[^}]*\}/);
    if (!jsonMatch) {
        return {}; // No valid JSON found
    }
    
    const extractedData = JSON.parse(jsonMatch[0]);
    
    // Validate and clean the extracted data
    const cleanedSlots: Record<string, any> = {};
    
    // Validate amount
    if (extractedData.amount) {
        const amount = String(extractedData.amount).replace(/[,$]/g, '');
        const numAmount = parseFloat(amount);
        if (!isNaN(numAmount) && numAmount > 0) {
            cleanedSlots.amount = amount;
        }
    }
    
    // Validate purpose
    if (extractedData.purpose) {
        const validPurposes = [
            'Home purchase',
            'Car purchase', 
            'Business expansion',
            'Personal expenses',
            'Education',
            'Other'
        ];
        
        const purpose = String(extractedData.purpose);
        if (validPurposes.includes(purpose)) {
            cleanedSlots.purpose = purpose;
        }
    }
    
    return cleanedSlots;
}

// Extract appointment-specific slots
async function extractAppointmentSlots(userInput: string): Promise<Record<string, any>> {
    // Format the prompt with user input
    const formattedPrompt = await appointmentSlotPrompt.format({ text: userInput });
    
    // Get response from OpenAI
    const response = await model.invoke(formattedPrompt);
    
    // Parse JSON response
    const content = response.content.toString().trim();
    
    // Extract JSON from response (in case there's extra text)
    const jsonMatch = content.match(/\{[^}]*\}/);
    if (!jsonMatch) {
        return {}; // No valid JSON found
    }
    
    const extractedData = JSON.parse(jsonMatch[0]);
    
    // Validate and clean the extracted data
    const cleanedSlots: Record<string, any> = {};
    
    // Validate date
    if (extractedData.date) {
        const date = String(extractedData.date).trim();
        if (date.length > 0) {
            cleanedSlots.date = date;
        }
    }
    
    // Validate time
    if (extractedData.time) {
        const time = String(extractedData.time).trim();
        if (time.length > 0) {
            cleanedSlots.time = time;
        }
    }
    
    // Validate service
    if (extractedData.service) {
        const validServices = [
            'Medical consultation',
            'Business meeting',
            'Personal consultation',
            'Technical support',
            'Other'
        ];
        
        const service = String(extractedData.service);
        if (validServices.includes(service)) {
            cleanedSlots.service = service;
        }
    }
    
    return cleanedSlots;
} 