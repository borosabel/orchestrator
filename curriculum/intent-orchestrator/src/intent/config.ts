import {handleLoanInquiry} from "../skills/loanInquiry";
import {handleAppointmentScheduling} from "../skills/appointmentScheduling";

export const intents = [
    { name: 'greet', patterns: [/hello/i, /hi/i] },
    { name: 'loan_inquiry', patterns: [/loan/i, /borrow/i] },
    { name: 'schedule_appointment', patterns: [/appointment/i, /schedule/i, /book/i] },
    { name: 'exit', patterns: [/bye/i, /exit/i] },
];

export const skills = {
    greet: async (_extractedSlots: Record<string, any> = {}) => "Hello! How can I help you?",
    loan_inquiry: handleLoanInquiry,
    schedule_appointment: handleAppointmentScheduling,
    exit: async (_extractedSlots: Record<string, any> = {}) => "Bye!",
    unknown: async (_extractedSlots: Record<string, any> = {}) => "Sorry, I didn't understand that.",
};