/**
 * Conversation Memory System
 * 
 * Tracks conversation context, user preferences, and interaction history
 * to provide better intent detection and slot extraction.
 */

export interface ConversationTurn {
    timestamp: Date;
    userInput: string;
    detectedIntent: string;
    extractedSlots: Record<string, any>;
    response: string;
    domain: string;
}

export interface UserPreferences {
    preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening';
    preferredDays?: string[];
    language?: string;
    communicationStyle?: 'formal' | 'casual';
    timezone?: string;
    // Domain-specific preferences
    [key: string]: any;
}

export interface SlotCollectionState {
    targetIntent: string;
    requiredSlots: string[];
    collectedSlots: Record<string, any>;
    missingSlots: string[];
    lastPromptedSlot?: string;
    attemptsPerSlot: Record<string, number>;
    maxAttempts: number;
}

export interface ConversationContext {
    currentTopic?: string;
    currentDomain: string;
    lastIntent?: string;
    expectingFollowUp?: boolean;
    slotCollectionInProgress?: SlotCollectionState;
    entityMentions: Record<string, any>; // Entities mentioned but not yet slotted
    conversationFlow: string[]; // High-level flow tracking
}

export interface ConversationSession {
    sessionId: string;
    userId?: string;
    startTime: Date;
    lastActivity: Date;
    domain: string;
    turns: ConversationTurn[];
    context: ConversationContext;
    preferences: UserPreferences;
    metadata: Record<string, any>;
}

/**
 * Conversation Memory Interface
 */
export interface ConversationMemory {
    // Session management
    createSession(domain: string, userId?: string): ConversationSession;
    getSession(sessionId: string): ConversationSession | null;
    updateSession(session: ConversationSession): void;
    deleteSession(sessionId: string): void;
    
    // Turn tracking
    addTurn(sessionId: string, turn: ConversationTurn): void;
    getRecentTurns(sessionId: string, count?: number): ConversationTurn[];
    
    // Context management
    updateContext(sessionId: string, context: Partial<ConversationContext>): void;
    getContext(sessionId: string): ConversationContext | null;
    
    // Preferences
    updatePreferences(sessionId: string, preferences: Partial<UserPreferences>): void;
    getPreferences(sessionId: string): UserPreferences | null;
    
    // Slot collection state
    startSlotCollection(sessionId: string, targetIntent: string, requiredSlots: string[]): void;
    updateSlotCollection(sessionId: string, slots: Record<string, any>): void;
    completeSlotCollection(sessionId: string): void;
    getSlotCollectionState(sessionId: string): SlotCollectionState | null;
    
    // Conversation analysis
    getConversationSummary(sessionId: string): string;
    findRecentMentions(sessionId: string, entityType: string): any[];
    isWaitingForSlot(sessionId: string, slotName: string): boolean;
}

/**
 * In-Memory Conversation Store
 */
export class InMemoryConversationStore implements ConversationMemory {
    private sessions: Map<string, ConversationSession> = new Map();
    private static instance: InMemoryConversationStore;

    constructor() {
        console.log('💭 Conversation memory store initialized');
    }

    static getInstance(): InMemoryConversationStore {
        if (!InMemoryConversationStore.instance) {
            InMemoryConversationStore.instance = new InMemoryConversationStore();
        }
        return InMemoryConversationStore.instance;
    }

    createSession(domain: string, userId?: string): ConversationSession {
        const sessionId = this.generateSessionId();
        const session: ConversationSession = {
            sessionId,
            userId,
            startTime: new Date(),
            lastActivity: new Date(),
            domain,
            turns: [],
            context: {
                currentDomain: domain,
                entityMentions: {},
                conversationFlow: ['session_start']
            },
            preferences: {},
            metadata: {}
        };
        
        this.sessions.set(sessionId, session);
        console.log(`📝 Created new conversation session: ${sessionId} for domain: ${domain}`);
        return session;
    }

    getSession(sessionId: string): ConversationSession | null {
        return this.sessions.get(sessionId) || null;
    }

    updateSession(session: ConversationSession): void {
        session.lastActivity = new Date();
        this.sessions.set(session.sessionId, session);
    }

    deleteSession(sessionId: string): void {
        this.sessions.delete(sessionId);
        console.log(`🗑️ Deleted conversation session: ${sessionId}`);
    }

    addTurn(sessionId: string, turn: ConversationTurn): void {
        const session = this.getSession(sessionId);
        if (!session) {
            console.error(`❌ Session not found: ${sessionId}`);
            return;
        }

        session.turns.push(turn);
        session.lastActivity = new Date();
        
        // Update context based on the turn
        this.updateContextFromTurn(session, turn);
        
        console.log(`💬 Added turn to session ${sessionId}. Total turns: ${session.turns.length}`);
    }

    getRecentTurns(sessionId: string, count: number = 5): ConversationTurn[] {
        const session = this.getSession(sessionId);
        if (!session) return [];
        
        return session.turns.slice(-count);
    }

    updateContext(sessionId: string, context: Partial<ConversationContext>): void {
        const session = this.getSession(sessionId);
        if (!session) return;
        
        session.context = { ...session.context, ...context };
        this.updateSession(session);
    }

    getContext(sessionId: string): ConversationContext | null {
        const session = this.getSession(sessionId);
        return session ? session.context : null;
    }

    updatePreferences(sessionId: string, preferences: Partial<UserPreferences>): void {
        const session = this.getSession(sessionId);
        if (!session) return;
        
        session.preferences = { ...session.preferences, ...preferences };
        this.updateSession(session);
        console.log(`⚙️ Updated preferences for session ${sessionId}:`, preferences);
    }

    getPreferences(sessionId: string): UserPreferences | null {
        const session = this.getSession(sessionId);
        return session ? session.preferences : null;
    }

    startSlotCollection(sessionId: string, targetIntent: string, requiredSlots: string[]): void {
        const session = this.getSession(sessionId);
        if (!session) return;
        
        session.context.slotCollectionInProgress = {
            targetIntent,
            requiredSlots,
            collectedSlots: {},
            missingSlots: [...requiredSlots],
            attemptsPerSlot: {},
            maxAttempts: 3
        };
        
        session.context.conversationFlow.push('slot_collection_start');
        this.updateSession(session);
        console.log(`🎯 Started slot collection for ${targetIntent}. Required slots:`, requiredSlots);
    }

    updateSlotCollection(sessionId: string, slots: Record<string, any>): void {
        const session = this.getSession(sessionId);
        if (!session || !session.context.slotCollectionInProgress) return;
        
        const slotState = session.context.slotCollectionInProgress;
        
        // Update collected slots
        for (const [slotName, slotValue] of Object.entries(slots)) {
            if (slotValue !== null && slotValue !== undefined && slotValue !== '') {
                slotState.collectedSlots[slotName] = slotValue;
            }
        }
        
        // Update missing slots
        slotState.missingSlots = slotState.requiredSlots.filter(
            slotName => !(slotName in slotState.collectedSlots)
        );
        
        this.updateSession(session);
        console.log(`📋 Updated slot collection. Collected:`, Object.keys(slotState.collectedSlots), 'Missing:', slotState.missingSlots);
    }

    completeSlotCollection(sessionId: string): void {
        const session = this.getSession(sessionId);
        if (!session) return;
        
        session.context.slotCollectionInProgress = undefined;
        session.context.conversationFlow.push('slot_collection_complete');
        this.updateSession(session);
        console.log(`✅ Completed slot collection for session ${sessionId}`);
    }

    getSlotCollectionState(sessionId: string): SlotCollectionState | null {
        const session = this.getSession(sessionId);
        return session?.context.slotCollectionInProgress || null;
    }

    getConversationSummary(sessionId: string): string {
        const session = this.getSession(sessionId);
        if (!session) return '';
        
        const recentTurns = this.getRecentTurns(sessionId, 3);
        const intents = recentTurns.map(turn => turn.detectedIntent);
        const context = session.context;
        
        return `Recent conversation: ${intents.join(' → ')}. Current topic: ${context.currentTopic || 'general'}. Flow: ${context.conversationFlow.slice(-3).join(' → ')}`;
    }

    findRecentMentions(sessionId: string, entityType: string): any[] {
        const session = this.getSession(sessionId);
        if (!session) return [];
        
        const mentions: any[] = [];
        const recentTurns = this.getRecentTurns(sessionId, 10);
        
        for (const turn of recentTurns) {
            // Simple entity extraction from slots
            for (const [slotName, slotValue] of Object.entries(turn.extractedSlots)) {
                if (slotName.includes(entityType.toLowerCase())) {
                    mentions.push({ turn: turn.timestamp, slot: slotName, value: slotValue });
                }
            }
        }
        
        return mentions;
    }

    isWaitingForSlot(sessionId: string, slotName: string): boolean {
        const slotState = this.getSlotCollectionState(sessionId);
        return slotState ? slotState.missingSlots.includes(slotName) : false;
    }

    // Private helper methods
    private generateSessionId(): string {
        return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private updateContextFromTurn(session: ConversationSession, turn: ConversationTurn): void {
        const context = session.context;
        
        // Update current intent and topic
        context.lastIntent = turn.detectedIntent;
        
        // Update topic based on intent
        if (turn.detectedIntent !== 'greet' && turn.detectedIntent !== 'exit' && turn.detectedIntent !== 'unknown') {
            context.currentTopic = turn.detectedIntent;
        }
        
        // Update conversation flow
        context.conversationFlow.push(turn.detectedIntent);
        
        // Keep only last 10 flow items to prevent memory bloat
        if (context.conversationFlow.length > 10) {
            context.conversationFlow = context.conversationFlow.slice(-10);
        }
        
        // Extract and store entity mentions from slots
        for (const [slotName, slotValue] of Object.entries(turn.extractedSlots)) {
            if (slotValue && slotValue !== '') {
                context.entityMentions[slotName] = slotValue;
            }
        }
        
        // Auto-detect preferences from slots
        this.extractPreferencesFromTurn(session, turn);
    }

    private extractPreferencesFromTurn(session: ConversationSession, turn: ConversationTurn): void {
        const slots = turn.extractedSlots;
        const preferences = session.preferences;
        
        // Extract time preferences
        if (slots.time && typeof slots.time === 'string') {
            const timeStr = slots.time.toLowerCase();
            if (timeStr.includes('morning') || timeStr.includes('am')) {
                preferences.preferredTimeOfDay = 'morning';
            } else if (timeStr.includes('afternoon') || timeStr.includes('pm')) {
                preferences.preferredTimeOfDay = 'afternoon';
            } else if (timeStr.includes('evening')) {
                preferences.preferredTimeOfDay = 'evening';
            }
        }
        
        // Extract day preferences
        if (slots.date && typeof slots.date === 'string') {
            const dateStr = slots.date.toLowerCase();
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const mentionedDays = days.filter(day => dateStr.includes(day));
            if (mentionedDays.length > 0) {
                preferences.preferredDays = preferences.preferredDays 
                    ? [...new Set([...preferences.preferredDays, ...mentionedDays])]
                    : mentionedDays;
            }
        }
    }

    // Utility methods for debugging and monitoring
    getActiveSessionCount(): number {
        return this.sessions.size;
    }

    getSessionIds(): string[] {
        return Array.from(this.sessions.keys());
    }

    cleanupOldSessions(maxAgeMinutes: number = 60): number {
        const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
        let cleanedCount = 0;
        
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.lastActivity < cutoffTime) {
                this.sessions.delete(sessionId);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} old conversation sessions`);
        }
        
        return cleanedCount;
    }
}

// Export singleton instance
export const conversationMemory = InMemoryConversationStore.getInstance(); 