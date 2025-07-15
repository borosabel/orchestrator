import { RuntimeConfig, SkillHandler } from '../config/configSchema';
import { configLoader } from '../config/configLoader';
import { genericIntentDetector } from './genericIntentDetector';
import { genericSlotExtractor } from './genericSlotExtractor';
import { conversationMemory, ConversationTurn } from './conversationMemory';

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
    private currentSessionId: string | null = null;

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
     * Start a new conversation session
     */
    startConversation(userId?: string): string {
        if (!this.currentConfig) {
            throw new Error("No domain configuration loaded. Please load a domain first.");
        }
        
        const session = conversationMemory.createSession(this.currentConfig.metadata.name, userId);
        this.currentSessionId = session.sessionId;
        console.log(`💬 Started new conversation session: ${session.sessionId}`);
        return session.sessionId;
    }

    /**
     * Process a user message with conversation memory context
     */
    async processMessage(userInput: string, sessionId?: string): Promise<string> {
        if (!this.currentConfig) {
            return "❌ No domain configuration loaded. Please load a domain first.";
        }

        // Use provided sessionId or current session, or create new one
        const activeSessionId = sessionId || this.currentSessionId || this.startConversation();
        
        try {
            console.log(`📝 Processing: "${userInput}" (Session: ${activeSessionId})`);

            // Get conversation context
            const context = conversationMemory.getContext(activeSessionId);
            const preferences = conversationMemory.getPreferences(activeSessionId);
            const slotCollectionState = conversationMemory.getSlotCollectionState(activeSessionId);

            // Step 1: Detect intent with conversation context
            const detectedIntent = await this.detectIntentWithContext(userInput, context, activeSessionId);
            console.log(`🎯 Intent: ${detectedIntent}`);

            // Step 2: Extract slots with conversation context and memory
            const extractedSlots = await this.extractSlotsWithContext(
                detectedIntent, 
                userInput, 
                context, 
                preferences, 
                slotCollectionState,
                activeSessionId
            );
            console.log(`📋 Slots:`, extractedSlots);

            // Step 3: Handle multi-turn slot collection if needed
            const { finalSlots, needsMoreInfo, followUpMessage } = await this.handleSlotCollection(
                detectedIntent,
                extractedSlots,
                activeSessionId
            );

            // Step 4: Execute skill if we have all required slots or don't need slot collection
            let response: string;
            if (needsMoreInfo && followUpMessage) {
                response = followUpMessage;
            } else {
                response = await this.executeSkill(detectedIntent, finalSlots);
            }

            // Step 5: Record conversation turn
            const turn: ConversationTurn = {
                timestamp: new Date(),
                userInput,
                detectedIntent,
                extractedSlots: finalSlots,
                response,
                domain: this.currentConfig.metadata.name
            };
            conversationMemory.addTurn(activeSessionId, turn);

            console.log(`🤖 Response generated successfully`);
            return response;

        } catch (error) {
            console.error('❌ Error processing message:', error);
            return this.getErrorResponse();
        }
    }

    /**
     * Process message with detailed context information
     */
    async processMessageWithContext(userInput: string, sessionId?: string): Promise<{
        input: string;
        intent: string;
        slots: Record<string, any>;
        response: string;
        domain: string;
        sessionId: string;
        context: any;
        preferences: any;
        processingTime: number;
    }> {
        const startTime = Date.now();
        const activeSessionId = sessionId || this.currentSessionId || this.startConversation();
        
        if (!this.currentConfig) {
            return {
                input: userInput,
                intent: 'error',
                slots: {},
                response: "❌ No domain configuration loaded.",
                domain: 'none',
                sessionId: activeSessionId,
                context: null,
                preferences: null,
                processingTime: Date.now() - startTime
            };
        }

        try {
            const context = conversationMemory.getContext(activeSessionId);
            const preferences = conversationMemory.getPreferences(activeSessionId);
            const slotCollectionState = conversationMemory.getSlotCollectionState(activeSessionId);

            const detectedIntent = await this.detectIntentWithContext(userInput, context, activeSessionId);
            const extractedSlots = await this.extractSlotsWithContext(
                detectedIntent, userInput, context, preferences, slotCollectionState, activeSessionId
            );
            
            const { finalSlots, needsMoreInfo, followUpMessage } = await this.handleSlotCollection(
                detectedIntent, extractedSlots, activeSessionId
            );

            const response = needsMoreInfo && followUpMessage 
                ? followUpMessage 
                : await this.executeSkill(detectedIntent, finalSlots);

            // Record turn
            const turn: ConversationTurn = {
                timestamp: new Date(),
                userInput,
                detectedIntent,
                extractedSlots: finalSlots,
                response,
                domain: this.currentConfig.metadata.name
            };
            conversationMemory.addTurn(activeSessionId, turn);

            return {
                input: userInput,
                intent: detectedIntent,
                slots: finalSlots,
                response,
                domain: this.currentConfig.metadata.name,
                sessionId: activeSessionId,
                context,
                preferences,
                processingTime: Date.now() - startTime
            };
        } catch (error) {
            return {
                input: userInput,
                intent: 'error',
                slots: {},
                response: this.getErrorResponse(),
                domain: this.currentConfig.metadata.name,
                sessionId: activeSessionId,
                context: conversationMemory.getContext(activeSessionId),
                preferences: conversationMemory.getPreferences(activeSessionId),
                processingTime: Date.now() - startTime
            };
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
     * Detect intent with conversation context
     */
    private async detectIntentWithContext(
        userInput: string, 
        _context: any, 
        _sessionId: string
    ): Promise<string> {
        // For now, use the standard intent detector
        // TODO: Enhance with context information in future iterations
        return await genericIntentDetector.detectIntent(userInput);
    }

    /**
     * Extract slots with conversation context and memory
     */
    private async extractSlotsWithContext(
        intent: string,
        userInput: string,
        context: any,
        preferences: any,
        slotCollectionState: any,
        _sessionId: string
    ): Promise<Record<string, any>> {
        // Get base slots from extractor
        let extractedSlots = await genericSlotExtractor.extractSlots(intent, userInput);

        // If we're in slot collection mode, merge with existing collected slots
        if (slotCollectionState) {
            extractedSlots = { ...slotCollectionState.collectedSlots, ...extractedSlots };
        }

        // Apply user preferences to fill missing slots where possible
        if (preferences) {
            if (!extractedSlots.time && preferences.preferredTimeOfDay) {
                extractedSlots.time = preferences.preferredTimeOfDay;
            }
            
            if (!extractedSlots.date && preferences.preferredDays && preferences.preferredDays.length > 0) {
                // Use first preferred day if no date specified
                extractedSlots.date = preferences.preferredDays[0];
            }
        }

        // Use entity mentions from conversation history to fill gaps
        if (context && context.entityMentions) {
            for (const [entityName, entityValue] of Object.entries(context.entityMentions)) {
                if (!extractedSlots[entityName] && entityValue) {
                    extractedSlots[entityName] = entityValue;
                    console.log(`🔗 Using entity from conversation history: ${entityName} = ${entityValue}`);
                }
            }
        }

        return extractedSlots;
    }

    /**
     * Handle multi-turn slot collection
     */
    private async handleSlotCollection(
        intent: string,
        extractedSlots: Record<string, any>,
        sessionId: string
    ): Promise<{
        finalSlots: Record<string, any>;
        needsMoreInfo: boolean;
        followUpMessage?: string;
    }> {
        // Find the intent configuration to check required slots
        const intentConfig = this.currentConfig?.intents.find(i => i.name === intent);
        if (!intentConfig || !intentConfig.slots || intentConfig.slots.length === 0) {
            // No slot collection needed for this intent
            return { finalSlots: extractedSlots, needsMoreInfo: false };
        }

        // Get required slots from intent configuration
        const requiredSlots = intentConfig.slots;
        const missingSlots = requiredSlots.filter(slot => !extractedSlots[slot] || extractedSlots[slot] === '');

        // Get current slot collection state
        let slotCollectionState = conversationMemory.getSlotCollectionState(sessionId);

        if (missingSlots.length === 0) {
            // All slots collected - complete the collection if it was in progress
            if (slotCollectionState) {
                conversationMemory.completeSlotCollection(sessionId);
            }
            return { finalSlots: extractedSlots, needsMoreInfo: false };
        }

        // Start slot collection if not already started
        if (!slotCollectionState) {
            conversationMemory.startSlotCollection(sessionId, intent, requiredSlots);
            slotCollectionState = conversationMemory.getSlotCollectionState(sessionId);
        }

        // Update slot collection with current progress
        conversationMemory.updateSlotCollection(sessionId, extractedSlots);

        // Generate follow-up question for the first missing slot
        const nextSlot = missingSlots[0];
        const followUpMessage = this.generateSlotFollowUpQuestion(nextSlot, intent);

        return {
            finalSlots: extractedSlots,
            needsMoreInfo: true,
            followUpMessage
        };
    }

    /**
     * Generate a follow-up question for missing slots
     */
    private generateSlotFollowUpQuestion(slotName: string, intent: string): string {
        const followUpQuestions: Record<string, Record<string, string>> = {
            schedule_appointment: {
                service: "What type of service would you like to schedule?",
                date: "What date would you prefer for your appointment?",
                time: "What time works best for you?",
                doctor: "Which doctor would you like to see?",
                phone: "Could you please provide your phone number?"
            },
            cancel_appointment: {
                confirmation_id: "Could you please provide your appointment confirmation ID (e.g., APT-123456)?"
            },
            check_availability: {
                service: "What type of service are you looking for?",
                date: "What date would you like to check availability for?"
            },
            loan_inquiry: {
                amount: "How much would you like to borrow?",
                purpose: "What is the loan for?",
                income: "What is your annual income?"
            },
            balance_check: {
                account_type: "Which account would you like to check? (checking, savings, credit)"
            },
            transaction_history: {
                account_type: "Which account's history would you like to see?",
                date_range: "What time period would you like to see? (Last 30 days, Last 3 months, etc.)"
            },
            symptom_check: {
                symptoms: "Could you describe your symptoms in more detail?",
                duration: "How long have you been experiencing these symptoms?"
            },
            prescription_refill: {
                medication: "Which medication do you need refilled?",
                pharmacy: "Which pharmacy would you like to use?"
            }
        };

        const intentQuestions = followUpQuestions[intent];
        if (intentQuestions && intentQuestions[slotName]) {
            return intentQuestions[slotName];
        }

        // Generic fallback
        return `Could you please provide your ${slotName.replace('_', ' ')}?`;
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
        currentSession: string | null;
        activeSessions: number;
    } {
        return {
            ready: this.isReady(),
            currentDomain: this.currentConfig?.metadata.name || null,
            loadedDomains: this.getAvailableDomains(),
            supportedIntents: this.currentConfig?.intents.length || 0,
            currentSession: this.currentSessionId,
            activeSessions: conversationMemory.getActiveSessionCount()
        };
    }

    /**
     * Get conversation session information
     */
    getSessionInfo(sessionId?: string): any {
        const targetSessionId = sessionId || this.currentSessionId;
        if (!targetSessionId) return null;

        const session = conversationMemory.getSession(targetSessionId);
        if (!session) return null;

        return {
            sessionId: session.sessionId,
            userId: session.userId,
            domain: session.domain,
            startTime: session.startTime,
            lastActivity: session.lastActivity,
            turnCount: session.turns.length,
            currentTopic: session.context.currentTopic,
            conversationFlow: session.context.conversationFlow,
            preferences: session.preferences,
            slotCollectionInProgress: !!session.context.slotCollectionInProgress
        };
    }

    /**
     * Get conversation summary
     */
    getConversationSummary(sessionId?: string): string {
        const targetSessionId = sessionId || this.currentSessionId;
        if (!targetSessionId) return 'No active conversation';

        return conversationMemory.getConversationSummary(targetSessionId);
    }

    /**
     * End current conversation session
     */
    endConversation(sessionId?: string): void {
        const targetSessionId = sessionId || this.currentSessionId;
        if (targetSessionId) {
            conversationMemory.deleteSession(targetSessionId);
            if (targetSessionId === this.currentSessionId) {
                this.currentSessionId = null;
            }
            console.log(`🛑 Ended conversation session: ${targetSessionId}`);
        }
    }

    /**
     * Switch to an existing conversation session
     */
    switchToSession(sessionId: string): boolean {
        const session = conversationMemory.getSession(sessionId);
        if (!session) {
            console.error(`❌ Session not found: ${sessionId}`);
            return false;
        }

        this.currentSessionId = sessionId;
        console.log(`🔄 Switched to conversation session: ${sessionId}`);
        return true;
    }

    /**
     * Cleanup old conversation sessions
     */
    cleanupOldSessions(maxAgeMinutes: number = 60): number {
        return conversationMemory.cleanupOldSessions(maxAgeMinutes);
    }
}

// Export singleton instance
export const genericOrchestrator = new GenericOrchestrator(); 