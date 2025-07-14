"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLoanInquiry = handleLoanInquiry;
async function handleLoanInquiry() {
    const loanAmount = Math.floor(Math.random() * 50000) + 5000;
    return `You can borrow up to ${loanAmount} euros.`;
}
//# sourceMappingURL=loanInquiry.js.map