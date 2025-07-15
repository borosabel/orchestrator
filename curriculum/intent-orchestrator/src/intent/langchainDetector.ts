import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI model
const model = new ChatOpenAI({
    modelName: process.env.DEFAULT_MODEL || "gpt-3.5-turbo",
    temperature: parseFloat(process.env.DEFAULT_TEMPERATURE || "0.1"),
    maxTokens: parseInt(process.env.DEFAULT_MAX_TOKENS || "100"),
});

// Define our intent classification prompt
const intentPrompt = PromptTemplate.fromTemplate(`
You are an intent classifier for a loan inquiry chatbot. 
Classify the user's message into one of these categories:

- greet: Greetings, hellos, introductions
- loan_inquiry: Questions about loans, borrowing money, financial assistance
- exit: Goodbyes, exit requests, ending conversation  
- unknown: Anything else that doesn't fit the above categories

User message: "{text}"

Respond with ONLY the intent name (greet, loan_inquiry, exit, or unknown).
`);

export async function detectIntentWithLangChain(text: string): Promise<string> {
    try {
        // Format the prompt with user input
        const formattedPrompt = await intentPrompt.format({ text });
        
        // Get response from OpenAI
        const response = await model.invoke(formattedPrompt);
        
        // Extract intent from response
        const intent = response.content.toString().trim().toLowerCase();
        
        // Validate the intent is one we support
        const validIntents = ['greet', 'loan_inquiry', 'exit', 'unknown'];
        return validIntents.includes(intent) ? intent : 'unknown';
        
    } catch (error) {
        console.error('Error in LangChain intent detection:', error);
        return 'unknown'; // Fallback to unknown on error
    }
} 