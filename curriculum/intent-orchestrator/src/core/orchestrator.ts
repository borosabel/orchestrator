import inquirer from 'inquirer';
import chalk from 'chalk';
import {detectIntent} from "../intent/intentDetector";
import {skills} from "../intent/config";
import {extractSlots} from "../slots/slotExtractor";
import {conversationMemory} from "../memory/conversationMemory";
import {slotDefinitions} from "../slots/slotDefinitions";

async function main() {
    console.log(chalk.cyan("Welcome to the LangChain Orchestrator Demo!"));
    while (true) {
        const { userInput } = await inquirer.prompt([{
            type: 'input',
            name: 'userInput',
            message: 'You:',
        }]);

        if (userInput.toLowerCase() === 'exit') {
            console.log(chalk.green('Bye!'));
            break;
        }

        const intent = await detectIntent(userInput);
        console.log(chalk.gray(`Detected intent: ${intent}`));

        // Extract slots from user input
        const extractedSlots = await extractSlots(intent, userInput);
        if (Object.keys(extractedSlots).length > 0) {
            console.log(chalk.gray(`Extracted info: ${JSON.stringify(extractedSlots)}`));
        }

        // Handle conversation memory and detect intent changes
        const { isIntentChange, previousIntent } = conversationMemory.startOrContinueConversationWithFeedback(intent, extractedSlots);
        const allCollectedSlots = conversationMemory.getCollectedSlots();
        
        // Provide feedback for intent changes
        if (isIntentChange) {
            const intentNames = {
                'loan_inquiry': 'loan application',
                'schedule_appointment': 'appointment scheduling'
            };
            const previousName = intentNames[previousIntent as keyof typeof intentNames] || previousIntent;
            const currentName = intentNames[intent as keyof typeof intentNames] || intent;
            console.log(chalk.yellow(`💭 I see you've switched from ${previousName} to ${currentName}. Starting fresh!`));
        }
        
        // Check if all required slots are filled
        const requiredSlots = slotDefinitions[intent] || [];
        const missingSlots = requiredSlots.filter(slot => !allCollectedSlots[slot.name]);
        
        if (missingSlots.length > 0) {
            console.log(chalk.gray(`Still need: ${missingSlots.map(s => s.name).join(', ')}`));
        }

        const handler = skills[intent as keyof typeof skills] || skills['unknown'];
        const response = await handler(allCollectedSlots);
        
        // Clear conversation memory after successful action
        if (intent !== 'unknown' && missingSlots.length === 0) {
            conversationMemory.clearConversation();
        }
        
        if (intent === 'exit') break;
        console.log(chalk.yellow("Bot:"), response);
    }
}

main();