import { intents } from "./config";
import { detectIntentWithLangChain } from "./langchainDetector";

// Original regex-based detector (kept as fallback)
export function detectIntentWithRegex(text: string): string {
    for (const intent of intents) {
        if (intent.patterns.some(pat => pat.test(text))) {
            return intent.name;
        }
    }
    return 'unknown';
}

// Main intent detector - uses LangChain with regex fallback
export async function detectIntent(text: string): Promise<string> {
    try {
        // Try LangChain first
        return await detectIntentWithLangChain(text);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn('LangChain intent detection failed, falling back to regex:', errorMessage);
        // Fallback to regex on error
        return detectIntentWithRegex(text);
    }
}

// Synchronous version for backward compatibility (uses regex only)
export function detectIntentSync(text: string): string {
    return detectIntentWithRegex(text);
}