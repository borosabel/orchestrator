#!/usr/bin/env node

import { createInterface } from 'readline';
import { genericOrchestrator } from './core/genericOrchestrator';
import { appointmentDomainConfig } from './domains/appointments.config';

/**
 * Main CLI entry point for the Generic Orchestrator
 * 
 * This demonstrates the generic orchestrator using the appointments domain configuration.
 * The same orchestrator can be configured for any business domain by loading different configs.
 */
async function startCLI() {
    console.log('\n🤖 Generic Orchestrator CLI');
    console.log('================================');
    
    try {
        // Load the default domain (appointments)
        console.log('📦 Loading appointments domain...');
        const loaded = await genericOrchestrator.loadDomain(appointmentDomainConfig);
        
        if (!loaded) {
            console.error('❌ Failed to load appointments domain');
            process.exit(1);
        }

        // Show domain information
        const domainInfo = genericOrchestrator.getCurrentDomain();
        console.log(`✅ Loaded: ${domainInfo.name} v${domainInfo.version}`);
        console.log(`📝 ${domainInfo.description}`);
        console.log(`🎯 Supported intents: ${domainInfo.intents.map((i: any) => i.name).join(', ')}`);
        console.log('\n💡 Try saying things like:');
        console.log('  • "Hello"');
        console.log('  • "I want to schedule an appointment for tomorrow"');
        console.log('  • "Check availability for medical appointments"');
        console.log('  • "Cancel appointment APT-123456"');
        console.log('  • "Exit" to quit\n');

    } catch (error) {
        console.error('❌ Initialization error:', error);
        process.exit(1);
    }

    // Create readline interface
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '? You: '
    });

    // Start the conversation loop
    rl.prompt();

    rl.on('line', async (input) => {
        const userInput = input.trim();
        
        if (!userInput) {
            rl.prompt();
            return;
        }

        try {
            // Process the message using the generic orchestrator
            const response = await genericOrchestrator.processMessage(userInput);
            console.log(`Bot: ${response}`);

            // Check for exit conditions
            if (userInput.toLowerCase().includes('exit') || 
                userInput.toLowerCase().includes('bye') || 
                userInput.toLowerCase().includes('quit')) {
                console.log('\nThank you for using the Generic Orchestrator! 👋');
                rl.close();
                return;
            }

        } catch (error) {
            console.error('❌ Error processing message:', error);
            console.log('Bot: Sorry, I encountered an error. Please try again.');
        }

        rl.prompt();
    });

    rl.on('close', () => {
        console.log('\nGoodbye! 👋');
        process.exit(0);
    });
}

// Handle uncaught errors gracefully
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the CLI
if (require.main === module) {
    startCLI().catch((error) => {
        console.error('❌ Failed to start CLI:', error);
        process.exit(1);
    });
} 