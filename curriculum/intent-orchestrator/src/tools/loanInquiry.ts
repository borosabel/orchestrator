import { collectSlots } from '../slotCollector';

export async function handleLoanInquiry(extractedSlots: Record<string, any> = {}) {
    const slots = await collectSlots('loan_inquiry', extractedSlots);
    
    const loanAmount = parseFloat(slots.amount);
    const purpose = slots.purpose;
    
    return `You've requested $${loanAmount.toLocaleString()} for ${purpose.toLowerCase()}. We'll review your application!`;
}