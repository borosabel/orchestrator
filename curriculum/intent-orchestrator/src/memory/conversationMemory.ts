interface ConversationState {
    currentIntent: string | null;
    collectedSlots: Record<string, any>;
    lastMessageTime: number;
}

class ConversationMemory {
    private state: ConversationState = {
        currentIntent: null,
        collectedSlots: {},
        lastMessageTime: Date.now()
    };

    // Check if we're continuing the same conversation
    isCurrentConversation(intent: string): boolean {
        const timeSinceLastMessage = Date.now() - this.state.lastMessageTime;
        const timeoutMs = 5 * 60 * 1000; // 5 minutes timeout
        
        return (
            this.state.currentIntent === intent &&
            timeSinceLastMessage < timeoutMs
        );
    }

    // Start a new conversation or continue existing one (enhanced version)
    startOrContinueConversationWithFeedback(intent: string, newSlots: Record<string, any> = {}): { isIntentChange: boolean, previousIntent: string | null } {
        const previousIntent = this.state.currentIntent;
        const isIntentChange = previousIntent !== null && previousIntent !== intent && intent !== 'greet' && intent !== 'exit' && intent !== 'unknown';
        
        if (this.isCurrentConversation(intent)) {
            // Continue existing conversation - merge new slots
            this.state.collectedSlots = { ...this.state.collectedSlots, ...newSlots };
        } else {
            // Start fresh conversation
            this.state.currentIntent = intent;
            this.state.collectedSlots = { ...newSlots };
        }
        this.state.lastMessageTime = Date.now();
        
        return { isIntentChange, previousIntent };
    }
    
    // Backward compatible method for existing code
    startOrContinueConversation(intent: string, newSlots: Record<string, any> = {}): void {
        this.startOrContinueConversationWithFeedback(intent, newSlots);
    }

    // Get all collected slots for current conversation
    getCollectedSlots(): Record<string, any> {
        return { ...this.state.collectedSlots };
    }

    // Clear conversation memory
    clearConversation(): void {
        this.state = {
            currentIntent: null,
            collectedSlots: {},
            lastMessageTime: Date.now()
        };
    }

    // Get current intent
    getCurrentIntent(): string | null {
        return this.state.currentIntent;
    }
}

// Export singleton instance
export const conversationMemory = new ConversationMemory(); 