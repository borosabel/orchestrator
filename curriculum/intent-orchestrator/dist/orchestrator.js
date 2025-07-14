"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const intentDetector_1 = require("./intentDetector");
const config_1 = require("./config");
async function main() {
    console.log(chalk_1.default.cyan("Welcome to the LangChain Orchestrator Demo!"));
    while (true) {
        const { userInput } = await inquirer_1.default.prompt([{
                type: 'input',
                name: 'userInput',
                message: 'You:',
            }]);
        if (userInput.toLowerCase() === 'exit') {
            console.log(chalk_1.default.green('Bye!'));
            break;
        }
        const intent = (0, intentDetector_1.detectIntent)(userInput);
        console.log(chalk_1.default.gray(`Detected intent: ${intent}`));
        const handler = config_1.skills[intent] || config_1.skills['unknown'];
        const response = await handler();
        if (intent === 'exit')
            break;
        console.log(chalk_1.default.yellow("Bot:"), response);
    }
}
main();
//# sourceMappingURL=orchestrator.js.map