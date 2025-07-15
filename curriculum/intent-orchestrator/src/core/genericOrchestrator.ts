import { RuntimeConfig, SkillHandler } from '../config/configSchema';
import { configLoader } from '../config/configLoader';
import { genericIntentDetector } from './genericIntentDetector';
import { genericSlotExtractor } from './genericSlotExtractor';

/**
 * Generic Orchestrator that works with any domain configuration
 * 
 * This is the main entry point for the configuration-driven conversational AI system.
 * It handles:
 * - Loading and switching between domain configurations
 * - Intent detection using configured prompts
 * - Slot extraction using configured templates
 * - Skill execution using configured handlers
 * - Conversation flow management
 */
export class GenericOrchestrator {
    private currentConfig: RuntimeConfig | null = null;
    private skillHandlers: Map<string, SkillHandler> = new Map();

    constructor() {
        console.log('🤖 Generic Orchestrator initialized');
    }

    /**
     * Load a domain configuration and switch to it
     */
    async loadDomain(config: any): Promise<boolean> {
        try {
            console.log(`🔄 Loading domain: ${config.metadata?.name || 'Unknown'}`);
            
            // Load and validate the configuration
            const runtimeConfig = await configLoader.loadConfig(config);
            
            if (!runtimeConfig.isValid) {
                console.error(`❌ Failed to load domain: Invalid configuration`);
                console.error('Errors:', runtimeConfig.validationResult.errors);
                return false;
            }

            // Store the current config
            this.currentConfig = runtimeConfig;

            // Initialize components with the new config
            await this.initializeComponents(runtimeConfig);

            // Extract skill handlers from config
            this.extractSkillHandlers(runtimeConfig);

            console.log(`✅ Successfully loaded domain: ${runtimeConfig.metadata.name}`);
            console.log(`🎯 Intents: ${runtimeConfig.intents.map(i => i.name).join(', ')}`);
            
            if (runtimeConfig.validationResult.warnings.length > 0) {
                console.warn('⚠️ Warnings:', runtimeConfig.validationResult.warnings);
            }

            return true;
        } catch (error) {
            console.error('❌ Error loading domain:', error);
            return false;
        }
    }

    /**
     * Switch to a different already-loaded domain
     */
    async switchDomain(domainName: string): Promise<boolean> {
        const success = configLoader.switchToConfig(domainName);
        if (success) {
            const newConfig = configLoader.getCurrentConfig();
            if (newConfig) {
                this.currentConfig = newConfig;
                await this.initializeComponents(newConfig);
                this.extractSkillHandlers(newConfig);
                return true;
            }
        }
        return false;
    }

    /**
     * Get all loaded domain names
     */
    getAvailableDomains(): string[] {
        return configLoader.getLoadedDomains();
    }

    /**
     * Get current domain information
     */
    getCurrentDomain(): any {
        return this.currentConfig ? {
            name: this.currentConfig.metadata.name,
            version: this.currentConfig.metadata.version,
            description: this.currentConfig.metadata.description,
            loadedAt: this.currentConfig.loadedAt,
            intents: this.currentConfig.intents.map(i => ({
                name: i.name,
                description: i.description,
                examples: i.examples
            }))
        } : null;
    }

    /**
     * Process a user message and return the response
     */
    async processMessage(userInput: string): Promise<string> {
        if (!this.currentConfig) {
            return "❌ No domain configuration loaded. Please load a domain first.";
        }

        try {
            console.log(`📝 Processing: "${userInput}"`);

            // Step 1: Detect intent
            const detectedIntent = await genericIntentDetector.detectIntent(userInput);
            console.log(`🎯 Intent: ${detectedIntent}`);

            // Step 2: Extract slots for the detected intent
            const extractedSlots = await genericSlotExtractor.extractSlots(detectedIntent, userInput);
            console.log(`📋 Slots:`, extractedSlots);

            // Step 3: Execute the skill handler
            const response = await this.executeSkill(detectedIntent, extractedSlots);
            console.log(`🤖 Response generated successfully`);

            return response;

        } catch (error) {
            console.error('❌ Error processing message:', error);
            return this.getErrorResponse();
        }
    }

    /**
     * Get detailed processing information for debugging
     */
    async processMessageDetailed(userInput: string): Promise<{
        input: string;
        intent: string;
        slots: Record<string, any>;
        response: string;
        domain: string;
        processingTime: number;
    }> {
        const startTime = Date.now();
        
        if (!this.currentConfig) {
            return {
                input: userInput,
                intent: 'error',
                slots: {},
                response: "❌ No domain configuration loaded.",
                domain: 'none',
                processingTime: Date.now() - startTime
            };
        }

        try {
            const detectedIntent = await genericIntentDetector.detectIntent(userInput);
            const extractedSlots = await genericSlotExtractor.extractSlots(detectedIntent, userInput);
            const response = await this.executeSkill(detectedIntent, extractedSlots);

            return {
                input: userInput,
                intent: detectedIntent,
                slots: extractedSlots,
                response: response,
                domain: this.currentConfig.metadata.name,
                processingTime: Date.now() - startTime
            };
        } catch (error) {
            return {
                input: userInput,
                intent: 'error',
                slots: {},
                response: this.getErrorResponse(),
                domain: this.currentConfig.metadata.name,
                processingTime: Date.now() - startTime
            };
        }
    }

    /**
     * Get information about supported intents in current domain
     */
    getSupportedIntents(): any[] {
        if (!this.currentConfig) return [];
        
        return this.currentConfig.intents.map(intent => ({
            name: intent.name,
            description: intent.description,
            examples: intent.examples || [],
            slots: intent.slots,
            hasSlotExtraction: genericSlotExtractor.hasSlotExtraction(intent.name)
        }));
    }

    /**
     * Initialize all components with the runtime configuration
     */
    private async initializeComponents(config: RuntimeConfig): Promise<void> {
        // Reset components first
        genericIntentDetector.reset();
        genericSlotExtractor.reset();

        // Initialize with new config
        await genericIntentDetector.initialize(config);
        await genericSlotExtractor.initialize(config);
    }

    /**
     * Extract and store skill handlers from configuration
     */
    private extractSkillHandlers(config: RuntimeConfig): void {
        this.skillHandlers.clear();
        
        for (const [skillName, skillHandler] of Object.entries(config.skills)) {
            this.skillHandlers.set(skillName, skillHandler);
        }

        console.log(`🛠️ Loaded ${this.skillHandlers.size} skill handlers`);
    }

    /**
     * Execute a skill handler for the given intent and slots
     */
    private async executeSkill(intent: string, extractedSlots: Record<string, any>): Promise<string> {
        // Find the intent configuration
        const intentConfig = this.currentConfig?.intents.find(i => i.name === intent);
        if (!intentConfig) {
            console.log(`❓ Unknown intent: ${intent}`);
            return await this.getUnknownIntentResponse();
        }

        // Get the skill handler
        const skillHandler = this.skillHandlers.get(intentConfig.skillHandler);
        if (!skillHandler) {
            console.error(`❌ No skill handler found for: ${intentConfig.skillHandler}`);
            return "Sorry, I can't handle that request right now. The service is temporarily unavailable.";
        }

        try {
            // Execute the skill handler
            return await skillHandler(extractedSlots);
        } catch (error) {
            console.error(`❌ Error executing skill ${intentConfig.skillHandler}:`, error);
            return "Sorry, I encountered an error while processing your request. Please try again.";
        }
    }

    /**
     * Get response for unknown intents
     */
     private async getUnknownIntentResponse(): Promise<string> {
        // Try to use the configured 'unknown' skill handler
        const unknownHandler = this.skillHandlers.get('unknown');
        if (unknownHandler) {
            try {
                return await unknownHandler({});
            } catch (error) {
                console.error('Error executing unknown handler:', error);
            }
        }

        // Fallback response
        return "I'm sorry, I didn't understand that. Could you please rephrase your request?";
    }

    /**
     * Get generic error response
     */
    private getErrorResponse(): string {
        return "Sorry, I encountered an error while processing your request. Please try again in a moment.";
    }

    /**
     * Check if orchestrator is ready to process messages
     */
    isReady(): boolean {
        return this.currentConfig !== null && this.currentConfig.isValid;
    }

    /**
     * Get orchestrator status
     */
    getStatus(): {
        ready: boolean;
        currentDomain: string | null;
        loadedDomains: string[];
        supportedIntents: number;
    } {
        return {
            ready: this.isReady(),
            currentDomain: this.currentConfig?.metadata.name || null,
            loadedDomains: this.getAvailableDomains(),
            supportedIntents: this.currentConfig?.intents.length || 0
        };
    }
}

// Export singleton instance
export const genericOrchestrator = new GenericOrchestrator(); 