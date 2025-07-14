export async function handleLoanInquiry() {
    const loanAmount = Math.floor(Math.random() * 50000) + 5000;
    return `You can borrow up to ${loanAmount} euros.`;
}