import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RuntimeConfig, SlotDefinition } from '../config/configSchema';
import { configLoader } from '../config/configLoader';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Generic Slot Extractor that works with any domain configuration
 */
export class GenericSlotExtractor {
    private model: ChatOpenAI;
    private promptTemplates: Map<string, PromptTemplate> = new Map();
    private slotDefinitions: Map<string, SlotDefinition[]> = new Map();

    constructor() {
        // Initialize OpenAI model with default settings
        this.model = new ChatOpenAI({
            modelName: process.env.DEFAULT_MODEL || "gpt-3.5-turbo",
            temperature: parseFloat(process.env.DEFAULT_TEMPERATURE || "0.1"),
            maxTokens: parseInt(process.env.DEFAULT_MAX_TOKENS || "200"),
        });
    }

    /**
     * Initialize the extractor with a domain configuration
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
                maxTokens: modelConfig.maxTokens ?? parseInt(process.env.DEFAULT_MAX_TOKENS || "200"),
            });
        }

        // Clear existing templates and definitions
        this.promptTemplates.clear();
        this.slotDefinitions.clear();

        // Create prompt templates for each intent
        for (const [intentName, promptTemplate] of Object.entries(config.prompts.slotExtraction)) {
            this.promptTemplates.set(intentName, PromptTemplate.fromTemplate(promptTemplate));
        }

        // Store slot definitions for validation
        for (const [intentName, slots] of Object.entries(config.slots)) {
            this.slotDefinitions.set(intentName, slots);
        }

        console.log(`🔧 Initialized slot extractor for domain: ${config.metadata.name}`);
        console.log(`📋 Supporting ${this.promptTemplates.size} intent slot extractions`);
    }

    /**
     * Extract slots for a given intent and user input
     */
    async extractSlots(intentName: string, userInput: string): Promise<Record<string, any>> {
        // Auto-initialize with current config if not already done
        if (this.promptTemplates.size === 0) {
            const currentConfig = configLoader.getCurrentConfig();
            if (!currentConfig) {
                throw new Error('No domain configuration loaded. Please load a domain first.');
            }
            await this.initialize(currentConfig);
        }

        try {
            // Check if we have a slot extraction template for this intent
            const promptTemplate = this.promptTemplates.get(intentName);
            if (!promptTemplate) {
                console.log(`No slot extraction template for intent: ${intentName}`);
                return {}; // No slot extraction for this intent
            }

            // Extract slots using LangChain
            const extractedSlots = await this.extractSlotsWithLangChain(intentName, userInput, promptTemplate);
            
            // Validate and clean the extracted slots
            return this.validateAndCleanSlots(intentName, extractedSlots);
            
        } catch (error) {
            console.error('Error in generic slot extraction:', error);
            return {}; // Return empty on error
        }
    }

    /**
     * Extract slots using LangChain for a specific intent
     */
    private async extractSlotsWithLangChain(
        intentName: string,
        userInput: string,
        promptTemplate: PromptTemplate
    ): Promise<Record<string, any>> {
        // Format the prompt with user input
        const formattedPrompt = await promptTemplate.format({ text: userInput });
        
        // Get response from OpenAI
        const response = await this.model.invoke(formattedPrompt);
        
        // Parse JSON response
        const content = response.content.toString().trim();
        
        // Extract JSON from response (in case there's extra text)
        const jsonMatch = content.match(/\{[^}]*\}/);
        if (!jsonMatch) {
            console.log(`No valid JSON found in response for ${intentName}:`, content);
            return {}; // No valid JSON found
        }

        try {
            return JSON.parse(jsonMatch[0]);
        } catch (parseError) {
            console.error(`JSON parse error for ${intentName}:`, parseError);
            return {};
        }
    }

    /**
     * Validate and clean extracted slots based on slot definitions
     */
    private validateAndCleanSlots(intentName: string, extractedSlots: Record<string, any>): Record<string, any> {
        const slotDefs = this.slotDefinitions.get(intentName);
        if (!slotDefs) {
            return extractedSlots; // No validation rules, return as-is
        }

        const cleanedSlots: Record<string, any> = {};

        // Validate each extracted slot
        for (const [slotName, slotValue] of Object.entries(extractedSlots)) {
            const slotDef = slotDefs.find(def => def.name === slotName);
            if (!slotDef) {
                // Unknown slot, but keep it anyway
                cleanedSlots[slotName] = slotValue;
                continue;
            }

            // Validate based on slot definition
            const cleanedValue = this.validateSlotValue(slotDef, slotValue);
            if (cleanedValue !== null) {
                cleanedSlots[slotName] = cleanedValue;
            }
        }

        return cleanedSlots;
    }

    /**
     * Validate a single slot value against its definition
     */
    private validateSlotValue(slotDef: SlotDefinition, value: any): any {
        if (value === null || value === undefined || value === '') {
            return null; // Empty values are handled elsewhere
        }

        const stringValue = String(value).trim();

        // Type-specific validation
        if (slotDef.type === 'list' && slotDef.choices) {
            // For list type, ensure the value is in the choices
            if (slotDef.choices.includes(stringValue)) {
                return stringValue;
            }
            console.log(`Invalid choice for ${slotDef.name}: ${stringValue}. Valid choices:`, slotDef.choices);
            return null;
        }

        // Custom validation function
        if (slotDef.validate) {
            try {
                const validationResult = slotDef.validate(stringValue);
                if (validationResult === true) {
                    return stringValue;
                } else if (typeof validationResult === 'string') {
                    console.log(`Validation failed for ${slotDef.name}: ${validationResult}`);
                    return null;
                } else {
                    console.log(`Validation failed for ${slotDef.name}: ${stringValue}`);
                    return null;
                }
            } catch (error) {
                console.error(`Validation error for ${slotDef.name}:`, error);
                return null;
            }
        }

        // Default: accept the value
        return stringValue;
    }

    /**
     * Get slot definitions for a specific intent
     */
    getSlotDefinitions(intentName: string): SlotDefinition[] {
        return this.slotDefinitions.get(intentName) || [];
    }

    /**
     * Check if an intent has slot extraction configured
     */
    hasSlotExtraction(intentName: string): boolean {
        return this.promptTemplates.has(intentName);
    }

    /**
     * Get all intents that have slot extraction configured
     */
    getIntentsWithSlotExtraction(): string[] {
        return Array.from(this.promptTemplates.keys());
    }

    /**
     * Reset the extractor (useful when switching domains)
     */
    reset(): void {
        this.promptTemplates.clear();
        this.slotDefinitions.clear();
        console.log('🔄 Slot extractor reset');
    }
}

// Export singleton instance
export const genericSlotExtractor = new GenericSlotExtractor(); 