import {handleLoanInquiry} from "./tools/loanInquiry";

export const intents = [
    { name: 'greet', patterns: [/hello/i, /hi/i] },
    { name: 'loan_inquiry', patterns: [/loan/i, /borrow/i] },
    { name: 'exit', patterns: [/bye/i, /exit/i] },
];

export const skills = {
    greet: async (_extractedSlots: Record<string, any> = {}) => "Hello! How can I help you?",
    loan_inquiry: handleLoanInquiry,
    exit: async (_extractedSlots: Record<string, any> = {}) => "Bye!",
    unknown: async (_extractedSlots: Record<string, any> = {}) => "Sorry, I didn't understand that.",
};