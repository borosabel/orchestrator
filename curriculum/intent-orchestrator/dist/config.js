"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skills = exports.intents = void 0;
const loanInquiry_1 = require("./tools/loanInquiry");
exports.intents = [
    { name: 'greet', patterns: [/hello/i, /hi/i] },
    { name: 'loan_inquiry', patterns: [/loan/i, /borrow/i] },
    { name: 'exit', patterns: [/bye/i, /exit/i] },
];
exports.skills = {
    greet: async () => "Hello! How can I help you?",
    loan_inquiry: loanInquiry_1.handleLoanInquiry,
    exit: async () => "Bye!",
    unknown: async () => "Sorry, I didn't understand that.",
};
//# sourceMappingURL=config.js.map