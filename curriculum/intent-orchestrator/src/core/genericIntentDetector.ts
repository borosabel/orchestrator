import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RuntimeConfig } from '../config/configSchema';
import { configLoader } from '../config/configLoader';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Generic Intent Detector that works with any domain configuration
 */
export class GenericIntentDetector {
    private model: ChatOpenAI;
    private promptTemplate: PromptTemplate | null = null;
    private validIntents: string[] = [];

    constructor() {
        // Initialize OpenAI model with default settings
        this.model = new ChatOpenAI({
            modelName: process.env.DEFAULT_MODEL || "gpt-3.5-turbo",
            temperature: parseFloat(process.env.DEFAULT_TEMPERATURE || "0.1"),
            maxTokens: parseInt(process.env.DEFAULT_MAX_TOKENS || "100"),
        });
    }

    /**
     * Initialize the detector with a domain configuration
     */
    async initialize(config: RuntimeConfig): Promise<void> {
        if (!config.isValid) {
            throw new Error(`Cannot initialize with invalid config: ${config.metadata.name}`);
        }

        // Update model settings if specified in config
        if (config.options?.modelConfig) {
            const modelConfig = config.options.modelConfig;
            this.model = new ChatOpenAI({
                modelName: modelConfig.model || process.env.DEFAULT_MODEL || "gpt-3.5-turbo",
                temperature: modelConfig.temperature ?? parseFloat(process.env.DEFAULT_TEMPERATURE || "0.1"),
                maxTokens: modelConfig.maxTokens ?? parseInt(process.env.DEFAULT_MAX_TOKENS || "100"),
            });
        }

        // Create prompt template from config
        this.promptTemplate = PromptTemplate.fromTemplate(config.prompts.intentDetection);
        
        // Extract valid intent names
        this.validIntents = config.intents.map(intent => intent.name);
        
        console.log(`🎯 Initialized intent detector for domain: ${config.metadata.name}`);
        console.log(`📝 Supporting ${this.validIntents.length} intents:`, this.validIntents.join(', '));
    }

    /**
     * Detect intent from user input using the current domain configuration
     */
    async detectIntent(text: string): Promise<string> {
        // Auto-initialize with current config if not already done
        if (!this.promptTemplate) {
            const currentConfig = configLoader.getCurrentConfig();
            if (!currentConfig) {
                throw new Error('No domain configuration loaded. Please load a domain first.');
            }
            await this.initialize(currentConfig);
        }

        try {
            // Format the prompt with user input
            const formattedPrompt = await this.promptTemplate!.format({ text });
            
            // Get response from OpenAI
            const response = await this.model.invoke(formattedPrompt);
            
            // Extract intent from response
            const intent = response.content.toString().trim().toLowerCase();
            
            // Validate the intent is one we support
            return this.validIntents.includes(intent) ? intent : 'unknown';
            
        } catch (error) {
            console.error('Error in generic intent detection:', error);
            return 'unknown'; // Fallback to unknown on error
        }
    }

    /**
     * Get all supported intents for the current domain
     */
    getSupportedIntents(): string[] {
        return [...this.validIntents];
    }

    /**
     * Check if a specific intent is supported
     */
    isIntentSupported(intent: string): boolean {
        return this.validIntents.includes(intent);
    }

    /**
     * Get intent information including patterns and examples
     */
    getIntentInfo(intentName: string): any {
        const currentConfig = configLoader.getCurrentConfig();
        if (!currentConfig) return null;

        return currentConfig.intents.find(intent => intent.name === intentName);
    }

    /**
     * Reset the detector (useful when switching domains)
     */
    reset(): void {
        this.promptTemplate = null;
        this.validIntents = [];
        console.log('🔄 Intent detector reset');
    }
}

// Export singleton instance
export const genericIntentDetector = new GenericIntentDetector(); 