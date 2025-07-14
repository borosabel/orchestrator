export function extractSlots(intentName: string, userInput: string): Record<string, any> {
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