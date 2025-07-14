import inquirer from 'inquirer';
import chalk from 'chalk';
import {detectIntent} from "./intentDetector";
import {skills} from "./config";
import {extractSlots} from "./slotExtractor";

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

        const intent = detectIntent(userInput);
        console.log(chalk.gray(`Detected intent: ${intent}`));

        // Extract slots from user input
        const extractedSlots = extractSlots(intent, userInput);
        if (Object.keys(extractedSlots).length > 0) {
            console.log(chalk.gray(`Extracted info: ${JSON.stringify(extractedSlots)}`));
        }

        const handler = skills[intent as keyof typeof skills] || skills['unknown'];
        const response = await handler(extractedSlots);
        if (intent === 'exit') break;
        console.log(chalk.yellow("Bot:"), response);
    }
}

main();