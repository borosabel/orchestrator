import { genericOrchestrator } from '../core/genericOrchestrator';
import { genericIntentDetector } from '../core/genericIntentDetector';
import { genericSlotExtractor } from '../core/genericSlotExtractor';
import { conversationMemory } from '../core/conversationMemory';
import { processVisualizer, ProcessStep } from './processVisualizer';

/**
 * Enhanced Orchestrator with Process Visualization
 * 
 * This wraps the generic orchestrator to provide detailed tracking
 * and visualization of the entire processing pipeline.
 */
export class VisualizedOrchestrator {
    
    /**
     * Process a message with full visualization tracking
     */
    async processMessageWithVisualization(
        userInput: string, 
        sessionId?: string
    ): Promise<{
        result: any;
        flowId: string;
        visualizations: {
            sequenceDiagram: string;
            flowchart: string;
            stateDiagram: string;
            report: string;
        };
    }> {
        // Start tracking the flow
        const activeSessionId = sessionId || genericOrchestrator.startConversation();
        const domain = genericOrchestrator.getCurrentDomain()?.name || 'unknown';
        const flowId = processVisualizer.startFlow(activeSessionId, domain, userInput);

        try {
            console.log('🎬 Starting visualized processing...');

            // Step 1: Initialize
            const initStep = this.addStep('INIT', 'Initialize Processing', 'processing', { userInput, sessionId: activeSessionId });
            this.updateStep(initStep, { status: 'completed', duration: 5 });

            // Step 2: Get conversation context
            const contextStep = this.addStep('CONTEXT', 'Load Conversation Context', 'memory');
            const context = conversationMemory.getContext(activeSessionId);
            const preferences = conversationMemory.getPreferences(activeSessionId);
            const slotCollectionState = conversationMemory.getSlotCollectionState(activeSessionId);
            this.updateStep(contextStep, { 
                status: 'completed', 
                duration: 10,
                output: { contextLoaded: !!context, preferencesLoaded: !!preferences }
            });

            // Step 3: Intent Detection
            const intentStep = this.addStep('INTENT', 'Detect Intent', 'processing', { text: userInput });
            const intentStart = Date.now();
            const detectedIntent = await genericIntentDetector.detectIntent(userInput);
            const intentDuration = Date.now() - intentStart;
            this.updateStep(intentStep, { 
                status: 'completed', 
                duration: intentDuration,
                output: detectedIntent
            });

            // Step 4: Intent Decision
            const decisionStep = this.addStep('DECISION', `Intent Decision: ${detectedIntent}`, 'decision');
            this.updateStep(decisionStep, { status: 'completed', duration: 2 });

            // Step 5: Slot Extraction
            const slotStep = this.addStep('SLOTS', 'Extract Slots', 'processing', { intent: detectedIntent, text: userInput });
            const slotStart = Date.now();
            const extractedSlots = await genericSlotExtractor.extractSlots(detectedIntent, userInput);
            const slotDuration = Date.now() - slotStart;
            this.updateStep(slotStep, { 
                status: 'completed', 
                duration: slotDuration,
                output: extractedSlots
            });

            // Step 6: Context Enhancement
            const enhanceStep = this.addStep('ENHANCE', 'Enhance Slots with Context', 'processing');
            let enhancedSlots = { ...extractedSlots };
            
            // Merge with slot collection state
            if (slotCollectionState) {
                enhancedSlots = { ...slotCollectionState.collectedSlots, ...enhancedSlots };
            }
            
            // Apply preferences
            if (preferences) {
                if (!enhancedSlots.time && preferences.preferredTimeOfDay) {
                    enhancedSlots.time = preferences.preferredTimeOfDay;
                }
            }

            this.updateStep(enhanceStep, { 
                status: 'completed', 
                duration: 15,
                output: enhancedSlots
            });

            // Get intent configuration (needed for both slot collection and skill execution)
            const intentConfig = genericOrchestrator.getCurrentDomain()?.intents.find((i: any) => i.name === detectedIntent);
            
            // Step 7: Slot Collection Handling
            const collectionStep = this.addStep('COLLECTION', 'Handle Slot Collection', 'decision');
            const requiredSlots = intentConfig?.slots || [];
            const missingSlots = requiredSlots.filter((slot: string) => !enhancedSlots[slot] || enhancedSlots[slot] === '');
            
            let needsMoreInfo = false;
            let followUpMessage = '';
            
            if (missingSlots.length > 0) {
                needsMoreInfo = true;
                followUpMessage = `I need more information. Please provide: ${missingSlots[0]}`;
                
                // Update memory
                if (!conversationMemory.getSlotCollectionState(activeSessionId)) {
                    conversationMemory.startSlotCollection(activeSessionId, detectedIntent, requiredSlots);
                }
                conversationMemory.updateSlotCollection(activeSessionId, enhancedSlots);
            }

            this.updateStep(collectionStep, { 
                status: 'completed', 
                duration: 20,
                output: { missingSlots, needsMoreInfo }
            });

            // Step 8: Skill Execution or Follow-up
            let response: string;
            if (needsMoreInfo) {
                const followUpStep = this.addStep('FOLLOWUP', 'Generate Follow-up Question', 'output');
                response = followUpMessage;
                this.updateStep(followUpStep, { 
                    status: 'completed', 
                    duration: 10,
                    output: response
                });
            } else {
                const skillStep = this.addStep('SKILL', 'Execute Skill', 'processing', { intent: detectedIntent, slots: enhancedSlots });
                const skillStart = Date.now();
                
                // Get the skill handler
                const skillHandler = genericOrchestrator.getCurrentDomain()?.skills?.[intentConfig?.skillHandler || ''];
                if (skillHandler) {
                    response = await skillHandler(enhancedSlots);
                } else {
                    response = `Sorry, I couldn't find a skill handler for intent: ${detectedIntent}. Available skills: ${Object.keys(genericOrchestrator.getCurrentDomain()?.skills || {}).join(', ')}`;
                }
                
                const skillDuration = Date.now() - skillStart;
                this.updateStep(skillStep, { 
                    status: 'completed', 
                    duration: skillDuration,
                    output: response
                });
            }

            // Step 9: Update Memory
            const memoryStep = this.addStep('MEMORY', 'Update Conversation Memory', 'memory');
            const turn = {
                timestamp: new Date(),
                userInput,
                detectedIntent,
                extractedSlots: enhancedSlots,
                response,
                domain
            };
            conversationMemory.addTurn(activeSessionId, turn);
            this.updateStep(memoryStep, { 
                status: 'completed', 
                duration: 25,
                output: 'Memory updated'
            });

            // Step 10: Finalize
            const finalStep = this.addStep('FINAL', 'Generate Response', 'output');
            this.updateStep(finalStep, { 
                status: 'completed', 
                duration: 5,
                output: response
            });

            // Complete the flow
            processVisualizer.completeFlow();

            // Generate visualizations
            const visualizations = {
                sequenceDiagram: processVisualizer.generateSequenceDiagram(),
                flowchart: processVisualizer.generateFlowchart(),
                stateDiagram: processVisualizer.generateStateDiagram(),
                report: processVisualizer.generateReport()
            };

            // Prepare result
            const result = {
                input: userInput,
                intent: detectedIntent,
                slots: enhancedSlots,
                response,
                domain,
                sessionId: activeSessionId,
                context,
                preferences,
                processingTime: processVisualizer.getFlows().slice(-1)[0]?.totalDuration || 0
            };

            return {
                result,
                flowId,
                visualizations
            };

        } catch (error) {
            // Handle errors and update visualization
            const errorStep = this.addStep('ERROR', 'Error Handling', 'processing');
            this.updateStep(errorStep, { 
                status: 'error', 
                duration: 5,
                output: error instanceof Error ? error.message : String(error)
            });

            processVisualizer.completeFlow();

            throw error;
        }
    }

    /**
     * Display animated process flow
     */
    async showAnimatedFlow(flowIndex: number = -1, speed: number = 1000): Promise<void> {
        return processVisualizer.displayAnimatedFlow(flowIndex, speed);
    }

    /**
     * Get all visualization data
     */
    getVisualizationData() {
        return {
            flows: processVisualizer.getFlows(),
            sequenceDiagram: processVisualizer.generateSequenceDiagram(),
            flowchart: processVisualizer.generateFlowchart(),
            stateDiagram: processVisualizer.generateStateDiagram(),
            report: processVisualizer.generateReport()
        };
    }

    /**
     * Clear all visualization data
     */
    clearVisualizationData(): void {
        processVisualizer.clearFlows();
    }

    /**
     * Helper methods for step management
     */
    private addStep(
        id: string, 
        name: string, 
        type: ProcessStep['type'], 
        input?: any
    ): string {
        processVisualizer.addStep({
            id,
            name,
            type,
            input
        });
        return id;
    }

    private updateStep(stepId: string, updates: Partial<ProcessStep>): void {
        processVisualizer.updateStep(stepId, updates);
    }

    /**
     * Load domain through the visualized orchestrator
     */
    async loadDomain(config: any): Promise<boolean> {
        return genericOrchestrator.loadDomain(config);
    }

    /**
     * Get current domain
     */
    getCurrentDomain() {
        return genericOrchestrator.getCurrentDomain();
    }

    /**
     * Start conversation
     */
    startConversation(userId?: string): string {
        return genericOrchestrator.startConversation(userId);
    }
}

// Export singleton instance
export const visualizedOrchestrator = new VisualizedOrchestrator(); 