import { extractSlotsWithLangChain } from './langchainExtractor';

// Original regex-based extractor (kept as fallback)
export function extractSlotsWithRegex(intentName: string, userInput: string): Record<string, any> {
    const extractedSlots: Record<string, any> = {};
    const lowerInput = userInput.toLowerCase();
    
    if (intentName === 'loan_inquiry') {
        // Extract amount (look for dollar amounts)
        const amountMatch = userInput.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        if (amountMatch) {
            extractedSlots.amount = amountMatch[1].replace(/,/g, '');
        }
        
        // Extract purpose (look for common loan purposes)
        const purposes = ['home', 'car', 'business', 'personal', 'education'];
        for (const purpose of purposes) {
            if (lowerInput.includes(purpose)) {
                // Map to our dropdown choices
                switch (purpose) {
                    case 'home':
                        extractedSlots.purpose = 'Home purchase';
                        break;
                    case 'car':
                        extractedSlots.purpose = 'Car purchase';
                        break;
                    case 'business':
                        extractedSlots.purpose = 'Business expansion';
                        break;
                    case 'personal':
                        extractedSlots.purpose = 'Personal expenses';
                        break;
                    case 'education':
                        extractedSlots.purpose = 'Education';
                        break;
                }
                break;
            }
        }
    }
    
    return extractedSlots;
}

// Main slot extractor - uses LangChain with regex fallback
export async function extractSlots(intentName: string, userInput: string): Promise<Record<string, any>> {
    try {
        // Try LangChain first
        const langchainSlots = await extractSlotsWithLangChain(intentName, userInput);
        
        // If LangChain extracted anything, use it
        if (Object.keys(langchainSlots).length > 0) {
            return langchainSlots;
        }
        
        // If LangChain didn't extract anything, fallback to regex
        return extractSlotsWithRegex(intentName, userInput);
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn('LangChain slot extraction failed, falling back to regex:', errorMessage);
        
        // Fallback to regex on error
        return extractSlotsWithRegex(intentName, userInput);
    }
}

// Synchronous version for backward compatibility (uses regex only)
export function extractSlotsSync(intentName: string, userInput: string): Record<string, any> {
    return extractSlotsWithRegex(intentName, userInput);
} 