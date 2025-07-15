export async function handleLoanInquiry(extractedSlots: Record<string, any> = {}) {
    const amount = extractedSlots.amount;
    const purpose = extractedSlots.purpose || 'general purposes';
    
    if (!amount) {
        return "I'd be happy to help you with a loan! Could you please tell me how much you'd like to borrow?";
    }
    
    const loanAmount = parseFloat(amount);
    if (isNaN(loanAmount) || loanAmount <= 0) {
        return "Please provide a valid loan amount. How much would you like to borrow?";
    }
    
    return `💰 **Loan Application Details**

📊 **Amount:** $${loanAmount.toLocaleString()}
🎯 **Purpose:** ${purpose}

✅ **Next Steps:**
• We'll review your application within 24-48 hours
• Our team will contact you for income verification
• Pre-approval typically takes 3-5 business days

📋 **Required Documents:**
• Photo ID
• Proof of income (pay stubs, tax returns)
• Bank statements (last 3 months)

💡 **Estimated monthly payment:** $${Math.round(loanAmount * 0.08 / 12).toLocaleString()}
📞 Questions? Call our loan specialists at 1-800-LOANS-NOW`;
}