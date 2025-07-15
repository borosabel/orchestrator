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

export async function extractSlotsWithLangChain(intentName: string, userInput: string): Promise<Record<string, any>> {
    try {
        if (intentName !== 'loan_inquiry') {
            return {}; // Only handle loan_inquiry for now
        }

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
        
    } catch (error) {
        console.error('Error in LangChain slot extraction:', error);
        return {}; // Return empty on error
    }
} 