#!/usr/bin/env node

import { createInterface } from 'readline';
import chalk from 'chalk';
import { genericOrchestrator } from '../core/genericOrchestrator';
import { genericIntentDetector } from '../core/genericIntentDetector';
import { genericSlotExtractor } from '../core/genericSlotExtractor';
import { conversationMemory } from '../core/conversationMemory';
import { appointmentDomainConfig } from '../domains/appointments.config';
import { bankingDomainConfig } from '../domains/banking.config';
import { healthcareDomainConfig } from '../domains/healthcare.config';
import { visualizedOrchestrator } from './visualizedOrchestrator';
import { processVisualizer } from './processVisualizer';

interface DemoSession {
    currentDomain: string;
    sessionId: string;
    processLogs: ProcessStep[];
}

interface ProcessStep {
    step: string;
    input?: any;
    output?: any;
    timestamp: Date;
    duration?: number;
}

class ModuleDemoManager {
    private session: DemoSession;
    private rl: any;

    constructor() {
        this.session = {
            currentDomain: 'appointments',
            sessionId: '',
            processLogs: []
        };
    }

    async start() {
        console.log(chalk.blue.bold('\n🔬 ORCHESTRATOR MODULE DEMO LAB'));
        console.log(chalk.blue('====================================='));
        console.log(chalk.gray('Interactive testing environment for orchestrator modules\n'));

        // Setup readline interface
        this.rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // Load default domain
        await this.loadDomain('appointments');
        
        // Show main menu
        await this.showMainMenu();
    }

    async showMainMenu() {
        const options = [
            '1. 🎯 Test Intent Detection',
            '2. 📋 Test Slot Extraction', 
            '3. 🧠 Test Conversation Memory',
            '4. 🤖 Test Full Orchestrator',
            '5. 🎬 Test Visualized Orchestrator',
            '6. 🔄 Switch Domain',
            '7. 📊 View Process Flow Graph',
            '8. 🔍 Inspect Module States',
            '9. 📈 Performance Analysis',
            '0. 🧪 Batch Testing',
            'q. Exit'
        ];

        console.log(chalk.yellow.bold('\n📋 DEMO MENU'));
        console.log(chalk.yellow('============='));
        options.forEach(option => console.log(chalk.white(option)));
        
        const choice = await this.askQuestion(chalk.cyan('\n? Select an option: '));
        
        switch (choice.trim()) {
            case '1': await this.testIntentDetection(); break;
            case '2': await this.testSlotExtraction(); break;
            case '3': await this.testConversationMemory(); break;
            case '4': await this.testFullOrchestrator(); break;
            case '5': await this.testVisualizedOrchestrator(); break;
            case '6': await this.switchDomain(); break;
            case '7': await this.showProcessFlowGraph(); break;
            case '8': await this.inspectModuleStates(); break;
            case '9': await this.performanceAnalysis(); break;
            case '0': await this.batchTesting(); break;
            case 'q': 
                console.log(chalk.green('\n👋 Thanks for using the Demo Lab! Goodbye!'));
                this.rl.close();
                return;
            default:
                console.log(chalk.red('❌ Invalid option. Please try again.'));
                await this.showMainMenu();
        }
    }

    async testIntentDetection() {
        console.log(chalk.blue.bold('\n🎯 INTENT DETECTION DEMO'));
        console.log(chalk.blue('========================'));
        console.log(chalk.gray(`Current domain: ${this.session.currentDomain}\n`));

        const input = await this.askQuestion('💬 Enter text to analyze: ');
        if (!input.trim()) {
            await this.showMainMenu();
            return;
        }

        console.log(chalk.yellow('\n⏳ Analyzing intent...'));
        const startTime = Date.now();

        try {
            const intent = await genericIntentDetector.detectIntent(input);
            const duration = Date.now() - startTime;

            // Log the process step
            this.session.processLogs.push({
                step: 'Intent Detection',
                input: input,
                output: intent,
                timestamp: new Date(),
                duration
            });

            // Show results
            console.log(chalk.green('\n✅ INTENT DETECTION RESULTS'));
            console.log(chalk.green('============================'));
            console.log(chalk.white(`📝 Input: "${input}"`));
            console.log(chalk.white(`🎯 Detected Intent: ${chalk.bold.yellow(intent)}`));
            console.log(chalk.white(`⏱️  Processing Time: ${duration}ms`));

            // Show intent details if available
            const domainInfo = genericOrchestrator.getCurrentDomain();
            const intentInfo = domainInfo.intents.find((i: any) => i.name === intent);
            if (intentInfo) {
                console.log(chalk.gray('\n📋 Intent Details:'));
                console.log(chalk.gray(`   Description: ${intentInfo.description}`));
                console.log(chalk.gray(`   Skill Handler: ${intentInfo.skillHandler}`));
                console.log(chalk.gray(`   Required Slots: ${intentInfo.slots.join(', ') || 'None'}`));
            }

            const continueTest = await this.askQuestion(chalk.cyan('\n🔄 Test another input? (y/n): '));
            if (continueTest.toLowerCase() === 'y') {
                await this.testIntentDetection();
            } else {
                await this.showMainMenu();
            }

        } catch (error) {
            console.log(chalk.red('\n❌ Error during intent detection:'));
            console.log(chalk.red(error));
            await this.showMainMenu();
        }
    }

    async testSlotExtraction() {
        console.log(chalk.blue.bold('\n📋 SLOT EXTRACTION DEMO'));
        console.log(chalk.blue('========================'));
        console.log(chalk.gray(`Current domain: ${this.session.currentDomain}\n`));

        // Get available intents
        const domainInfo = genericOrchestrator.getCurrentDomain();
        const intentsWithSlots = domainInfo.intents.filter((i: any) => i.slots && i.slots.length > 0);

        if (intentsWithSlots.length === 0) {
            console.log(chalk.yellow('⚠️ No intents with slot extraction in current domain.'));
            await this.showMainMenu();
            return;
        }

        console.log(chalk.yellow('Available intents with slot extraction:'));
        intentsWithSlots.forEach((intent: any, index: number) => {
            console.log(chalk.white(`${index + 1}. ${intent.name} (slots: ${intent.slots.join(', ')})`));
        });

        const intentChoice = await this.askQuestion(chalk.cyan('\n? Select intent number (or type intent name): '));
        let selectedIntent: any;

        // Parse choice
        const choiceNum = parseInt(intentChoice.trim());
        if (!isNaN(choiceNum) && choiceNum > 0 && choiceNum <= intentsWithSlots.length) {
            selectedIntent = intentsWithSlots[choiceNum - 1];
        } else {
            selectedIntent = intentsWithSlots.find((i: any) => i.name === intentChoice.trim());
        }

        if (!selectedIntent) {
            console.log(chalk.red('❌ Invalid intent selection.'));
            await this.testSlotExtraction();
            return;
        }

        const input = await this.askQuestion('💬 Enter text for slot extraction: ');
        if (!input.trim()) {
            await this.showMainMenu();
            return;
        }

        console.log(chalk.yellow('\n⏳ Extracting slots...'));
        const startTime = Date.now();

        try {
            const slots = await genericSlotExtractor.extractSlots(selectedIntent.name, input);
            const duration = Date.now() - startTime;

            // Log the process step
            this.session.processLogs.push({
                step: 'Slot Extraction',
                input: { intent: selectedIntent.name, text: input },
                output: slots,
                timestamp: new Date(),
                duration
            });

            // Show results
            console.log(chalk.green('\n✅ SLOT EXTRACTION RESULTS'));
            console.log(chalk.green('==========================='));
            console.log(chalk.white(`📝 Input: "${input}"`));
            console.log(chalk.white(`🎯 Intent: ${selectedIntent.name}`));
            console.log(chalk.white(`⏱️  Processing Time: ${duration}ms`));
            
            if (Object.keys(slots).length > 0) {
                console.log(chalk.white('\n📋 Extracted Slots:'));
                Object.entries(slots).forEach(([key, value]) => {
                    console.log(chalk.white(`   ${chalk.bold.yellow(key)}: ${value}`));
                });
            } else {
                console.log(chalk.gray('\n📋 No slots extracted'));
            }

            // Show required vs extracted
            const requiredSlots = selectedIntent.slots;
            const missingSlots = requiredSlots.filter((slot: string) => !slots[slot]);
            if (missingSlots.length > 0) {
                console.log(chalk.red(`\n⚠️ Missing required slots: ${missingSlots.join(', ')}`));
            }

            const continueTest = await this.askQuestion(chalk.cyan('\n🔄 Test another extraction? (y/n): '));
            if (continueTest.toLowerCase() === 'y') {
                await this.testSlotExtraction();
            } else {
                await this.showMainMenu();
            }

        } catch (error) {
            console.log(chalk.red('\n❌ Error during slot extraction:'));
            console.log(chalk.red(error));
            await this.showMainMenu();
        }
    }

    async testConversationMemory() {
        console.log(chalk.blue.bold('\n🧠 CONVERSATION MEMORY DEMO'));
        console.log(chalk.blue('============================'));

        if (!this.session.sessionId) {
            this.session.sessionId = conversationMemory.createSession(this.session.currentDomain).sessionId;
            console.log(chalk.green(`✅ Created new session: ${this.session.sessionId}`));
        }

        const memoryOptions = [
            '1. 📝 Add conversation turn',
            '2. 🔍 View conversation context',
            '3. 👤 View/Update user preferences',
            '4. 📋 View slot collection state',
            '5. 📊 Get conversation summary',
            '6. 🔄 Start new session',
            '7. ← Back to main menu'
        ];

        console.log(chalk.yellow('\n📋 Memory Operations:'));
        memoryOptions.forEach(option => console.log(chalk.white(option)));

        const choice = await this.askQuestion(chalk.cyan('\n? Select operation: '));

        switch (choice.trim()) {
            case '1': await this.addConversationTurn(); break;
            case '2': await this.viewConversationContext(); break;
            case '3': await this.manageUserPreferences(); break;
            case '4': await this.viewSlotCollectionState(); break;
            case '5': await this.getConversationSummary(); break;
            case '6': await this.startNewSession(); break;
            case '7': await this.showMainMenu(); break;
            default:
                console.log(chalk.red('❌ Invalid option.'));
                await this.testConversationMemory();
        }
    }

    async testFullOrchestrator() {
        console.log(chalk.blue.bold('\n🤖 FULL ORCHESTRATOR DEMO'));
        console.log(chalk.blue('==========================='));

        if (!this.session.sessionId) {
            this.session.sessionId = genericOrchestrator.startConversation();
            console.log(chalk.green(`✅ Started conversation session: ${this.session.sessionId}`));
        }

        const input = await this.askQuestion('💬 Enter message to process: ');
        if (!input.trim()) {
            await this.showMainMenu();
            return;
        }

        console.log(chalk.yellow('\n⏳ Processing through full orchestrator...'));
        const startTime = Date.now();

        try {
            // Use the detailed processing method to get step-by-step info
            const result = await genericOrchestrator.processMessageWithContext(input, this.session.sessionId);
            const duration = Date.now() - startTime;

            // Log the complete process
            this.session.processLogs.push({
                step: 'Full Orchestrator',
                input: input,
                output: result,
                timestamp: new Date(),
                duration
            });

            // Show detailed results
            console.log(chalk.green('\n✅ ORCHESTRATOR PROCESSING RESULTS'));
            console.log(chalk.green('===================================='));
            console.log(chalk.white(`📝 Input: "${result.input}"`));
            console.log(chalk.white(`🎯 Detected Intent: ${chalk.bold.yellow(result.intent)}`));
            console.log(chalk.white(`🏷️  Domain: ${result.domain}`));
            console.log(chalk.white(`⏱️  Total Processing Time: ${result.processingTime}ms`));
            console.log(chalk.white(`🆔 Session ID: ${result.sessionId}`));

            if (Object.keys(result.slots).length > 0) {
                console.log(chalk.white('\n📋 Extracted Slots:'));
                Object.entries(result.slots).forEach(([key, value]) => {
                    console.log(chalk.white(`   ${chalk.bold.yellow(key)}: ${value}`));
                });
            }

            console.log(chalk.white('\n🤖 Bot Response:'));
            console.log(chalk.green(`"${result.response}"`));

            // Show context if available
            if (result.context) {
                console.log(chalk.gray('\n🧠 Conversation Context:'));
                console.log(chalk.gray(`   Last Intent: ${result.context.lastIntent}`));
                console.log(chalk.gray(`   Current Topic: ${result.context.currentTopic}`));
                console.log(chalk.gray(`   Entity Mentions: ${Object.keys(result.context.entityMentions || {}).length}`));
            }

            const continueChat = await this.askQuestion(chalk.cyan('\n🔄 Continue conversation? (y/n): '));
            if (continueChat.toLowerCase() === 'y') {
                await this.testFullOrchestrator();
            } else {
                await this.showMainMenu();
            }

        } catch (error) {
            console.log(chalk.red('\n❌ Error during orchestrator processing:'));
            console.log(chalk.red(error));
            await this.showMainMenu();
        }
    }

    async switchDomain() {
        console.log(chalk.blue.bold('\n🔄 DOMAIN SWITCHING'));
        console.log(chalk.blue('==================='));

        const domains = [
            { name: 'appointments', config: appointmentDomainConfig, desc: 'Appointment booking system' },
            { name: 'banking', config: bankingDomainConfig, desc: 'Banking services system' },
            { name: 'healthcare', config: healthcareDomainConfig, desc: 'Healthcare patient portal' }
        ];

        console.log(chalk.yellow('Available domains:'));
        domains.forEach((domain, index) => {
            const current = domain.name === this.session.currentDomain ? chalk.green(' (CURRENT)') : '';
            console.log(chalk.white(`${index + 1}. ${domain.name} - ${domain.desc}${current}`));
        });

        const choice = await this.askQuestion(chalk.cyan('\n? Select domain number: '));
        const domainIndex = parseInt(choice.trim()) - 1;

        if (domainIndex >= 0 && domainIndex < domains.length) {
            await this.loadDomain(domains[domainIndex].name, domains[domainIndex].config);
        } else {
            console.log(chalk.red('❌ Invalid domain selection.'));
        }

        await this.showMainMenu();
    }

    async showProcessFlowGraph() {
        console.log(chalk.blue.bold('\n📊 PROCESS FLOW VISUALIZATION'));
        console.log(chalk.blue('=============================='));

        if (this.session.processLogs.length === 0) {
            console.log(chalk.yellow('⚠️ No process logs available. Run some tests first!'));
            await this.showMainMenu();
            return;
        }

        // Generate visual representation
        console.log(chalk.green('\n📈 Recent Process Steps:'));
        this.session.processLogs.slice(-10).forEach((step, index) => {
            const arrow = index < this.session.processLogs.length - 1 ? '↓' : '●';
            console.log(chalk.white(`${arrow} ${step.step} (${step.duration}ms) - ${step.timestamp.toLocaleTimeString()}`));
            if (step.input) {
                console.log(chalk.gray(`  Input: ${typeof step.input === 'string' ? step.input : JSON.stringify(step.input).substring(0, 50)}...`));
            }
        });

        const showMermaid = await this.askQuestion(chalk.cyan('\n🎨 Generate Mermaid diagram? (y/n): '));
        if (showMermaid.toLowerCase() === 'y') {
            await this.generateMermaidDiagram();
        }

        await this.showMainMenu();
    }

    async inspectModuleStates() {
        console.log(chalk.blue.bold('\n🔍 MODULE STATE INSPECTION'));
        console.log(chalk.blue('==========================='));

        // Show orchestrator status
        const status = genericOrchestrator.getStatus();
        console.log(chalk.green('\n🤖 Orchestrator Status:'));
        console.log(chalk.white(`   Ready: ${status.ready ? '✅' : '❌'}`));
        console.log(chalk.white(`   Current Domain: ${status.currentDomain}`));
        console.log(chalk.white(`   Loaded Domains: ${status.loadedDomains.join(', ')}`));
        console.log(chalk.white(`   Supported Intents: ${status.supportedIntents}`));
        console.log(chalk.white(`   Active Sessions: ${status.activeSessions}`));

        // Show domain details
        const domainInfo = genericOrchestrator.getCurrentDomain();
        console.log(chalk.green('\n🏷️ Current Domain Details:'));
        console.log(chalk.white(`   Name: ${domainInfo.name}`));
        console.log(chalk.white(`   Version: ${domainInfo.version}`));
        console.log(chalk.white(`   Description: ${domainInfo.description}`));
        console.log(chalk.white(`   Intents: ${domainInfo.intents.map((i: any) => i.name).join(', ')}`));

        // Show session details if available
        if (this.session.sessionId) {
            const context = conversationMemory.getContext(this.session.sessionId);
            const sessionInfo = conversationMemory.getSession(this.session.sessionId);
            console.log(chalk.green('\n🧠 Session Memory State:'));
            console.log(chalk.white(`   Session ID: ${this.session.sessionId}`));
            if (context) {
                console.log(chalk.white(`   Last Intent: ${context.lastIntent || 'None'}`));
                console.log(chalk.white(`   Current Topic: ${context.currentTopic || 'None'}`));
                console.log(chalk.white(`   Turn Count: ${sessionInfo?.turns.length || 0}`));
                console.log(chalk.white(`   Entity Mentions: ${Object.keys(context.entityMentions || {}).length}`));
            }
        }

        await this.askQuestion(chalk.cyan('\n👀 Press Enter to continue...'));
        await this.showMainMenu();
    }

    async performanceAnalysis() {
        console.log(chalk.blue.bold('\n📈 PERFORMANCE ANALYSIS'));
        console.log(chalk.blue('======================='));

        if (this.session.processLogs.length === 0) {
            console.log(chalk.yellow('⚠️ No performance data available. Run some tests first!'));
            await this.showMainMenu();
            return;
        }

        // Analyze performance metrics
        const stepTypes = [...new Set(this.session.processLogs.map(log => log.step))];
        
        console.log(chalk.green('\n⏱️ Performance Summary:'));
        stepTypes.forEach(stepType => {
            const steps = this.session.processLogs.filter(log => log.step === stepType);
            const durations = steps.map(step => step.duration || 0);
            const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
            const minDuration = Math.min(...durations);
            const maxDuration = Math.max(...durations);
            
            console.log(chalk.white(`\n${stepType}:`));
            console.log(chalk.white(`   Executions: ${steps.length}`));
            console.log(chalk.white(`   Avg Time: ${avgDuration.toFixed(2)}ms`));
            console.log(chalk.white(`   Min Time: ${minDuration}ms`));
            console.log(chalk.white(`   Max Time: ${maxDuration}ms`));
        });

        await this.askQuestion(chalk.cyan('\n👀 Press Enter to continue...'));
        await this.showMainMenu();
    }

    async batchTesting() {
        console.log(chalk.blue.bold('\n🧪 BATCH TESTING'));
        console.log(chalk.blue('================='));

        const testInputs = [
            'Hello',
            'I want to schedule an appointment for tomorrow',
            'Cancel my appointment APT-123456',
            'What\'s available next week?',
            'Goodbye'
        ];

        console.log(chalk.yellow('Running batch test with sample inputs...'));
        
        for (let i = 0; i < testInputs.length; i++) {
            const input = testInputs[i];
            console.log(chalk.cyan(`\n${i + 1}. Testing: "${input}"`));
            
            try {
                const startTime = Date.now();
                const result = await genericOrchestrator.processMessageWithContext(input, this.session.sessionId);
                const duration = Date.now() - startTime;
                
                console.log(chalk.green(`   ✅ Intent: ${result.intent} (${duration}ms)`));
                console.log(chalk.gray(`   Response: ${result.response.substring(0, 80)}...`));
                
                this.session.processLogs.push({
                    step: 'Batch Test',
                    input: input,
                    output: result,
                    timestamp: new Date(),
                    duration
                });
                
            } catch (error) {
                console.log(chalk.red(`   ❌ Error: ${error}`));
            }
        }

        console.log(chalk.green('\n✅ Batch testing completed!'));
        await this.askQuestion(chalk.cyan('\n👀 Press Enter to continue...'));
        await this.showMainMenu();
    }

    // Helper methods
    private async addConversationTurn() {
        const input = await this.askQuestion('💬 Enter user input: ');
        const intent = await this.askQuestion('🎯 Enter detected intent: ');
        const response = await this.askQuestion('🤖 Enter bot response: ');

        const turn = {
            timestamp: new Date(),
            userInput: input,
            detectedIntent: intent,
            extractedSlots: {},
            response: response,
            domain: this.session.currentDomain
        };

        conversationMemory.addTurn(this.session.sessionId, turn);
        console.log(chalk.green('✅ Conversation turn added!'));
        await this.testConversationMemory();
    }

    private async viewConversationContext() {
        const context = conversationMemory.getContext(this.session.sessionId);
        console.log(chalk.green('\n🧠 Conversation Context:'));
        console.log(chalk.white(JSON.stringify(context, null, 2)));
        await this.askQuestion(chalk.cyan('\n👀 Press Enter to continue...'));
        await this.testConversationMemory();
    }

    private async manageUserPreferences() {
        const preferences = conversationMemory.getPreferences(this.session.sessionId);
        console.log(chalk.green('\n👤 Current User Preferences:'));
        console.log(chalk.white(JSON.stringify(preferences, null, 2)));
        
        const update = await this.askQuestion('🔄 Update preferences? (y/n): ');
        if (update.toLowerCase() === 'y') {
            // Simple preference update demo
            conversationMemory.updatePreferences(this.session.sessionId, {
                preferredTimeOfDay: 'morning',
                preferredDays: ['Monday', 'Wednesday', 'Friday']
            });
            console.log(chalk.green('✅ Preferences updated!'));
        }
        await this.testConversationMemory();
    }

    private async viewSlotCollectionState() {
        const slotState = conversationMemory.getSlotCollectionState(this.session.sessionId);
        console.log(chalk.green('\n📋 Slot Collection State:'));
        console.log(chalk.white(JSON.stringify(slotState, null, 2)));
        await this.askQuestion(chalk.cyan('\n👀 Press Enter to continue...'));
        await this.testConversationMemory();
    }

    private async getConversationSummary() {
        const summary = conversationMemory.getConversationSummary(this.session.sessionId);
        console.log(chalk.green('\n📊 Conversation Summary:'));
        console.log(chalk.white(summary));
        await this.askQuestion(chalk.cyan('\n👀 Press Enter to continue...'));
        await this.testConversationMemory();
    }

    private async startNewSession() {
        this.session.sessionId = conversationMemory.createSession(this.session.currentDomain).sessionId;
        console.log(chalk.green(`✅ Started new session: ${this.session.sessionId}`));
        await this.testConversationMemory();
    }

    async testVisualizedOrchestrator() {
        console.log(chalk.blue.bold('\n🎬 VISUALIZED ORCHESTRATOR DEMO'));
        console.log(chalk.blue('=================================='));

        if (!this.session.sessionId) {
            this.session.sessionId = visualizedOrchestrator.startConversation();
            console.log(chalk.green(`✅ Started visualization session: ${this.session.sessionId}`));
        }

        const input = await this.askQuestion('💬 Enter message to process with visualization: ');
        if (!input.trim()) {
            await this.showMainMenu();
            return;
        }

        console.log(chalk.yellow('\n⏳ Processing with full visualization tracking...'));

        try {
            const result = await visualizedOrchestrator.processMessageWithVisualization(input, this.session.sessionId);

            console.log(chalk.green('\n✅ VISUALIZED PROCESSING COMPLETE'));
            console.log(chalk.green('=================================='));
            console.log(chalk.white(`📝 Input: "${result.result.input}"`));
            console.log(chalk.white(`🎯 Intent: ${chalk.bold.yellow(result.result.intent)}`));
            console.log(chalk.white(`⏱️  Processing Time: ${result.result.processingTime}ms`));
            
            if (Object.keys(result.result.slots).length > 0) {
                console.log(chalk.white('\n📋 Extracted Slots:'));
                Object.entries(result.result.slots).forEach(([key, value]) => {
                    console.log(chalk.white(`   ${chalk.bold.yellow(key)}: ${value}`));
                });
            }

            console.log(chalk.white('\n🤖 Bot Response:'));
            console.log(chalk.green(`"${result.result.response}"`));

            // Show visualization options
            const vizOptions = [
                '1. 📈 Show Sequence Diagram',
                '2. 🔄 Show Flowchart',
                '3. 🔍 Show State Diagram', 
                '4. 📊 Show Process Report',
                '5. 🎬 Animated Flow Replay',
                '6. ← Back to main menu'
            ];

            console.log(chalk.yellow('\n📊 Visualization Options:'));
            vizOptions.forEach(option => console.log(chalk.white(option)));

            const vizChoice = await this.askQuestion(chalk.cyan('\n? Select visualization: '));

            switch (vizChoice.trim()) {
                case '1':
                    console.log(chalk.blue('\n📈 SEQUENCE DIAGRAM:'));
                    console.log(chalk.gray('```mermaid'));
                    console.log(chalk.white(result.visualizations.sequenceDiagram));
                    console.log(chalk.gray('```'));
                    break;
                case '2':
                    console.log(chalk.blue('\n🔄 FLOWCHART:'));
                    console.log(chalk.gray('```mermaid'));
                    console.log(chalk.white(result.visualizations.flowchart));
                    console.log(chalk.gray('```'));
                    break;
                case '3':
                    console.log(chalk.blue('\n🔍 STATE DIAGRAM:'));
                    console.log(chalk.gray('```mermaid'));
                    console.log(chalk.white(result.visualizations.stateDiagram));
                    console.log(chalk.gray('```'));
                    break;
                case '4':
                    console.log(chalk.blue('\n📊 PROCESS REPORT:'));
                    console.log(chalk.white(result.visualizations.report));
                    break;
                case '5':
                    console.log(chalk.blue('\n🎬 ANIMATED FLOW REPLAY:'));
                    await visualizedOrchestrator.showAnimatedFlow(-1, 800);
                    break;
                case '6':
                    await this.showMainMenu();
                    return;
            }

            const continueTest = await this.askQuestion(chalk.cyan('\n🔄 Test another input? (y/n): '));
            if (continueTest.toLowerCase() === 'y') {
                await this.testVisualizedOrchestrator();
            } else {
                await this.showMainMenu();
            }

        } catch (error) {
            console.log(chalk.red('\n❌ Error during visualized processing:'));
            console.log(chalk.red(error));
            await this.showMainMenu();
        }
    }

    private async generateMermaidDiagram() {
        const flows = processVisualizer.getFlows();
        if (flows.length === 0) {
            console.log(chalk.yellow('⚠️ No visualization data available. Run some tests first!'));
            return;
        }

        const diagramOptions = [
            '1. 📈 Sequence Diagram',
            '2. 🔄 Flowchart Diagram',
            '3. 🔍 State Diagram',
            '4. 📊 All Diagrams'
        ];

        console.log(chalk.yellow('\n🎨 Available Diagram Types:'));
        diagramOptions.forEach(option => console.log(chalk.white(option)));

        const choice = await this.askQuestion(chalk.cyan('\n? Select diagram type: '));

        switch (choice.trim()) {
            case '1':
                console.log(chalk.blue('\n📈 SEQUENCE DIAGRAM:'));
                console.log(chalk.gray('```mermaid'));
                console.log(chalk.white(processVisualizer.generateSequenceDiagram()));
                console.log(chalk.gray('```'));
                break;
            case '2':
                console.log(chalk.blue('\n🔄 FLOWCHART DIAGRAM:'));
                console.log(chalk.gray('```mermaid'));
                console.log(chalk.white(processVisualizer.generateFlowchart()));
                console.log(chalk.gray('```'));
                break;
            case '3':
                console.log(chalk.blue('\n🔍 STATE DIAGRAM:'));
                console.log(chalk.gray('```mermaid'));
                console.log(chalk.white(processVisualizer.generateStateDiagram()));
                console.log(chalk.gray('```'));
                break;
            case '4':
                console.log(chalk.blue('\n📈 SEQUENCE DIAGRAM:'));
                console.log(chalk.gray('```mermaid'));
                console.log(chalk.white(processVisualizer.generateSequenceDiagram()));
                console.log(chalk.gray('```\n'));
                
                console.log(chalk.blue('🔄 FLOWCHART DIAGRAM:'));
                console.log(chalk.gray('```mermaid'));
                console.log(chalk.white(processVisualizer.generateFlowchart()));
                console.log(chalk.gray('```\n'));
                
                console.log(chalk.blue('🔍 STATE DIAGRAM:'));
                console.log(chalk.gray('```mermaid'));
                console.log(chalk.white(processVisualizer.generateStateDiagram()));
                console.log(chalk.gray('```'));
                break;
        }

        await this.askQuestion(chalk.cyan('\n👀 Press Enter to continue...'));
    }

    private async loadDomain(domainName: string, config?: any) {
        console.log(chalk.yellow(`🔄 Loading ${domainName} domain...`));
        
        try {
            let domainConfig = config;
            if (!domainConfig) {
                switch (domainName) {
                    case 'appointments': domainConfig = appointmentDomainConfig; break;
                    case 'banking': domainConfig = bankingDomainConfig; break;
                    case 'healthcare': domainConfig = healthcareDomainConfig; break;
                    default: throw new Error(`Unknown domain: ${domainName}`);
                }
            }

            const loaded = await genericOrchestrator.loadDomain(domainConfig);
            if (loaded) {
                this.session.currentDomain = domainName;
                this.session.sessionId = ''; // Reset session when switching domains
                console.log(chalk.green(`✅ Successfully loaded ${domainName} domain!`));
            } else {
                console.log(chalk.red(`❌ Failed to load ${domainName} domain`));
            }
        } catch (error) {
            console.log(chalk.red(`❌ Error loading domain: ${error}`));
        }
    }

    private askQuestion(question: string): Promise<string> {
        return new Promise((resolve) => {
            this.rl.question(question, (answer: string) => {
                resolve(answer);
            });
        });
    }
}

// Main execution
async function startModuleDemo() {
    const demo = new ModuleDemoManager();
    await demo.start();
}

// Export for CLI usage
if (require.main === module) {
    startModuleDemo().catch(console.error);
}

export { ModuleDemoManager, startModuleDemo }; 