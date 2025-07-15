import { 
    InMemoryConversationStore, 
    ConversationSession,
    ConversationTurn,
    UserPreferences,
    conversationMemory 
} from '../../src/core/conversationMemory';

describe('Conversation Memory System', () => {
    let memory: InMemoryConversationStore;
    let session: ConversationSession;

    beforeEach(() => {
        // Create fresh memory instance for each test
        memory = new InMemoryConversationStore();
        session = memory.createSession('appointments', 'user123');
    });

    describe('Session Management', () => {
        test('should create a new session', () => {
            expect(session.sessionId).toBeDefined();
            expect(session.userId).toBe('user123');
            expect(session.domain).toBe('appointments');
            expect(session.turns).toEqual([]);
            expect(session.context.currentDomain).toBe('appointments');
            expect(session.context.conversationFlow).toEqual(['session_start']);
        });

        test('should retrieve existing session', () => {
            const retrieved = memory.getSession(session.sessionId);
            expect(retrieved).toEqual(session);
        });

        test('should return null for non-existent session', () => {
            const retrieved = memory.getSession('non-existent');
            expect(retrieved).toBeNull();
        });

        test('should delete session', () => {
            memory.deleteSession(session.sessionId);
            const retrieved = memory.getSession(session.sessionId);
            expect(retrieved).toBeNull();
        });

        test('should update session activity time', () => {
            const originalTime = session.lastActivity;
            
            // Wait a bit then update
            setTimeout(() => {
                memory.updateSession(session);
                expect(session.lastActivity.getTime()).toBeGreaterThan(originalTime.getTime());
            }, 10);
        });
    });

    describe('Turn Tracking', () => {
        test('should add conversation turns', () => {
            const turn: ConversationTurn = {
                timestamp: new Date(),
                userInput: "I want to schedule an appointment",
                detectedIntent: "schedule_appointment",
                extractedSlots: { service: "dental cleaning" },
                response: "I'd be happy to help you schedule an appointment.",
                domain: "appointments"
            };

            memory.addTurn(session.sessionId, turn);
            
            const turns = memory.getRecentTurns(session.sessionId);
            expect(turns).toHaveLength(1);
            expect(turns[0]).toEqual(turn);
        });

        test('should update context from turns', () => {
            const turn: ConversationTurn = {
                timestamp: new Date(),
                userInput: "Schedule dental appointment for Tuesday morning",
                detectedIntent: "schedule_appointment",
                extractedSlots: { 
                    service: "dental cleaning",
                    date: "Tuesday",
                    time: "morning"
                },
                response: "Scheduling your dental appointment.",
                domain: "appointments"
            };

            memory.addTurn(session.sessionId, turn);
            
            const context = memory.getContext(session.sessionId)!;
            expect(context.lastIntent).toBe('schedule_appointment');
            expect(context.currentTopic).toBe('schedule_appointment');
            expect(context.conversationFlow).toContain('schedule_appointment');
            expect(context.entityMentions).toEqual({
                service: "dental cleaning",
                date: "Tuesday", 
                time: "morning"
            });
        });

        test('should limit recent turns count', () => {
            // Add 10 turns
            for (let i = 0; i < 10; i++) {
                const turn: ConversationTurn = {
                    timestamp: new Date(),
                    userInput: `Message ${i}`,
                    detectedIntent: "greet",
                    extractedSlots: {},
                    response: `Response ${i}`,
                    domain: "appointments"
                };
                memory.addTurn(session.sessionId, turn);
            }

            const recent3 = memory.getRecentTurns(session.sessionId, 3);
            expect(recent3).toHaveLength(3);
            expect(recent3[2].userInput).toBe('Message 9'); // Most recent
        });

        test('should auto-detect time preferences', () => {
            const turn: ConversationTurn = {
                timestamp: new Date(),
                userInput: "Schedule for tomorrow morning",
                detectedIntent: "schedule_appointment",
                extractedSlots: { time: "tomorrow morning" },
                response: "Scheduling morning appointment.",
                domain: "appointments"
            };

            memory.addTurn(session.sessionId, turn);
            
            const preferences = memory.getPreferences(session.sessionId)!;
            expect(preferences.preferredTimeOfDay).toBe('morning');
        });

        test('should auto-detect day preferences', () => {
            const turn: ConversationTurn = {
                timestamp: new Date(),
                userInput: "I prefer Mondays and Fridays",
                detectedIntent: "schedule_appointment",
                extractedSlots: { date: "Mondays and Fridays" },
                response: "Noted your preference.",
                domain: "appointments"
            };

            memory.addTurn(session.sessionId, turn);
            
            const preferences = memory.getPreferences(session.sessionId)!;
            expect(preferences.preferredDays).toContain('monday');
            expect(preferences.preferredDays).toContain('friday');
        });
    });

    describe('Context Management', () => {
        test('should update conversation context', () => {
            memory.updateContext(session.sessionId, {
                currentTopic: 'appointment_scheduling',
                expectingFollowUp: true
            });

            const context = memory.getContext(session.sessionId)!;
            expect(context.currentTopic).toBe('appointment_scheduling');
            expect(context.expectingFollowUp).toBe(true);
        });

        test('should maintain conversation flow history', () => {
            const intents = ['greet', 'schedule_appointment', 'cancel_appointment', 'exit'];
            
            intents.forEach(intent => {
                const turn: ConversationTurn = {
                    timestamp: new Date(),
                    userInput: `Intent: ${intent}`,
                    detectedIntent: intent,
                    extractedSlots: {},
                    response: "Response",
                    domain: "appointments"
                };
                memory.addTurn(session.sessionId, turn);
            });

            const context = memory.getContext(session.sessionId)!;
            expect(context.conversationFlow).toEqual([
                'session_start', 'greet', 'schedule_appointment', 'cancel_appointment', 'exit'
            ]);
        });

        test('should limit conversation flow history', () => {
            // Add 15 intents (more than the 10 limit)
            for (let i = 0; i < 15; i++) {
                const turn: ConversationTurn = {
                    timestamp: new Date(),
                    userInput: `Intent ${i}`,
                    detectedIntent: `intent_${i}`,
                    extractedSlots: {},
                    response: "Response",
                    domain: "appointments"
                };
                memory.addTurn(session.sessionId, turn);
            }

            const context = memory.getContext(session.sessionId)!;
            expect(context.conversationFlow).toHaveLength(10); // Should be capped at 10
            expect(context.conversationFlow[0]).toBe('intent_5'); // Should start from intent_5
        });
    });

    describe('User Preferences', () => {
        test('should update user preferences', () => {
            const preferences: Partial<UserPreferences> = {
                preferredTimeOfDay: 'afternoon',
                language: 'en',
                communicationStyle: 'formal'
            };

            memory.updatePreferences(session.sessionId, preferences);
            
            const stored = memory.getPreferences(session.sessionId)!;
            expect(stored.preferredTimeOfDay).toBe('afternoon');
            expect(stored.language).toBe('en');
            expect(stored.communicationStyle).toBe('formal');
        });

        test('should merge preferences', () => {
            memory.updatePreferences(session.sessionId, { preferredTimeOfDay: 'morning' });
            memory.updatePreferences(session.sessionId, { language: 'en' });
            
            const preferences = memory.getPreferences(session.sessionId)!;
            expect(preferences.preferredTimeOfDay).toBe('morning');
            expect(preferences.language).toBe('en');
        });
    });

    describe('Slot Collection', () => {
        test('should start slot collection', () => {
            const requiredSlots = ['service', 'date', 'time'];
            memory.startSlotCollection(session.sessionId, 'schedule_appointment', requiredSlots);

            const state = memory.getSlotCollectionState(session.sessionId)!;
            expect(state.targetIntent).toBe('schedule_appointment');
            expect(state.requiredSlots).toEqual(requiredSlots);
            expect(state.missingSlots).toEqual(requiredSlots);
            expect(state.collectedSlots).toEqual({});
        });

        test('should update slot collection progress', () => {
            memory.startSlotCollection(session.sessionId, 'schedule_appointment', ['service', 'date', 'time']);
            
            memory.updateSlotCollection(session.sessionId, { 
                service: 'dental cleaning',
                date: 'Monday'
            });

            const state = memory.getSlotCollectionState(session.sessionId)!;
            expect(state.collectedSlots).toEqual({
                service: 'dental cleaning',
                date: 'Monday'
            });
            expect(state.missingSlots).toEqual(['time']);
        });

        test('should complete slot collection', () => {
            memory.startSlotCollection(session.sessionId, 'schedule_appointment', ['service']);
            memory.completeSlotCollection(session.sessionId);

            const state = memory.getSlotCollectionState(session.sessionId);
            expect(state).toBeNull();
            
            const context = memory.getContext(session.sessionId)!;
            expect(context.conversationFlow).toContain('slot_collection_complete');
        });

        test('should check if waiting for specific slot', () => {
            memory.startSlotCollection(session.sessionId, 'schedule_appointment', ['service', 'date']);
            memory.updateSlotCollection(session.sessionId, { service: 'dental' });

            expect(memory.isWaitingForSlot(session.sessionId, 'date')).toBe(true);
            expect(memory.isWaitingForSlot(session.sessionId, 'service')).toBe(false);
            expect(memory.isWaitingForSlot(session.sessionId, 'time')).toBe(false);
        });
    });

    describe('Conversation Analysis', () => {
        test('should generate conversation summary', () => {
            const turns: ConversationTurn[] = [
                {
                    timestamp: new Date(),
                    userInput: "Hello",
                    detectedIntent: "greet",
                    extractedSlots: {},
                    response: "Hi there!",
                    domain: "appointments"
                },
                {
                    timestamp: new Date(),
                    userInput: "Schedule appointment",
                    detectedIntent: "schedule_appointment",
                    extractedSlots: { service: "dental" },
                    response: "Let's schedule that.",
                    domain: "appointments"
                }
            ];

            turns.forEach(turn => memory.addTurn(session.sessionId, turn));
            
            const summary = memory.getConversationSummary(session.sessionId);
            expect(summary).toContain('greet → schedule_appointment');
            expect(summary).toContain('schedule_appointment');
        });

        test('should find recent entity mentions', () => {
            const turn: ConversationTurn = {
                timestamp: new Date(),
                userInput: "Schedule dental appointment",
                detectedIntent: "schedule_appointment",
                extractedSlots: { 
                    service: "dental cleaning",
                    doctor: "Dr. Smith"
                },
                response: "Scheduling with Dr. Smith.",
                domain: "appointments"
            };

            memory.addTurn(session.sessionId, turn);
            
            const serviceMentions = memory.findRecentMentions(session.sessionId, 'service');
            expect(serviceMentions).toHaveLength(1);
            expect(serviceMentions[0].value).toBe('dental cleaning');

            const doctorMentions = memory.findRecentMentions(session.sessionId, 'doctor');
            expect(doctorMentions).toHaveLength(1);
            expect(doctorMentions[0].value).toBe('Dr. Smith');
        });
    });

    describe('Memory Management', () => {
        test('should count active sessions', () => {
            expect(memory.getActiveSessionCount()).toBe(1); // Our test session
            
            memory.createSession('banking', 'user456');
            expect(memory.getActiveSessionCount()).toBe(2);
        });

        test('should list session IDs', () => {
            const sessionIds = memory.getSessionIds();
            expect(sessionIds).toContain(session.sessionId);
        });

        test('should cleanup old sessions', () => {
            // Create an old session by manually setting lastActivity
            const oldSession = memory.createSession('banking');
            
            // Manually set the lastActivity to 2 hours ago (don't call updateSession as it resets the timestamp)
            oldSession.lastActivity = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
            
            // Verify session exists before cleanup
            expect(memory.getSession(oldSession.sessionId)).not.toBeNull();

            const cleanedCount = memory.cleanupOldSessions(60); // 60 minutes max age
            expect(cleanedCount).toBe(1);
            expect(memory.getSession(oldSession.sessionId)).toBeNull();
        });
    });

    describe('Singleton Instance', () => {
        test('should provide global conversation memory instance', () => {
            expect(conversationMemory).toBeInstanceOf(InMemoryConversationStore);
            
            // Test that it's truly a singleton
            const anotherReference = InMemoryConversationStore.getInstance();
            expect(anotherReference).toBe(conversationMemory);
        });
    });

    describe('Error Handling', () => {
        test('should handle operations on non-existent sessions gracefully', () => {
            expect(() => {
                memory.addTurn('non-existent', {
                    timestamp: new Date(),
                    userInput: "test",
                    detectedIntent: "test",
                    extractedSlots: {},
                    response: "test",
                    domain: "test"
                });
            }).not.toThrow();

            expect(memory.getContext('non-existent')).toBeNull();
            expect(memory.getPreferences('non-existent')).toBeNull();
            expect(memory.getSlotCollectionState('non-existent')).toBeNull();
        });

        test('should handle empty slot updates', () => {
            memory.startSlotCollection(session.sessionId, 'test_intent', ['slot1']);
            
            expect(() => {
                memory.updateSlotCollection(session.sessionId, {
                    slot1: null,
                    slot2: undefined,
                    slot3: ''
                });
            }).not.toThrow();

            const state = memory.getSlotCollectionState(session.sessionId)!;
            expect(state.collectedSlots).toEqual({});
        });
    });

    describe('Integration Scenarios', () => {
        test('should handle multi-turn appointment scheduling conversation', () => {
            // Turn 1: Initial greeting
            memory.addTurn(session.sessionId, {
                timestamp: new Date(),
                userInput: "Hello",
                detectedIntent: "greet",
                extractedSlots: {},
                response: "Hi! How can I help you today?",
                domain: "appointments"
            });

            // Turn 2: Intent to schedule
            memory.addTurn(session.sessionId, {
                timestamp: new Date(),
                userInput: "I need to schedule an appointment",
                detectedIntent: "schedule_appointment",
                extractedSlots: { service: "dental cleaning" },
                response: "I'd be happy to help schedule your dental cleaning.",
                domain: "appointments"
            });

            // Start slot collection
            memory.startSlotCollection(session.sessionId, 'schedule_appointment', ['service', 'date', 'time']);
            memory.updateSlotCollection(session.sessionId, { service: 'dental cleaning' });

            // Turn 3: Provide date
            memory.addTurn(session.sessionId, {
                timestamp: new Date(),
                userInput: "How about next Monday?",
                detectedIntent: "schedule_appointment",
                extractedSlots: { date: "next Monday" },
                response: "Monday works! What time would you prefer?",
                domain: "appointments"
            });

            memory.updateSlotCollection(session.sessionId, { date: 'next Monday' });

            // Turn 4: Provide time
            memory.addTurn(session.sessionId, {
                timestamp: new Date(),
                userInput: "10 AM would be perfect",
                detectedIntent: "schedule_appointment",
                extractedSlots: { time: "10 AM" },
                response: "Perfect! Your appointment is scheduled.",
                domain: "appointments"
            });

            memory.updateSlotCollection(session.sessionId, { time: '10 AM' });
            memory.completeSlotCollection(session.sessionId);

            // Verify the complete conversation state
            const context = memory.getContext(session.sessionId)!;
            const preferences = memory.getPreferences(session.sessionId)!;
            const turns = memory.getRecentTurns(session.sessionId);

            expect(turns).toHaveLength(4);
            expect(context.currentTopic).toBe('schedule_appointment');
            expect(context.conversationFlow).toContain('slot_collection_complete');
            expect(preferences.preferredTimeOfDay).toBe('morning'); // Auto-detected from "10 AM"
            expect(context.entityMentions).toEqual({
                service: 'dental cleaning',
                date: 'next Monday',
                time: '10 AM'
            });
        });
    });
}); 