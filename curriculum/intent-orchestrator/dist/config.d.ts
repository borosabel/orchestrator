import { handleLoanInquiry } from "./tools/loanInquiry";
export declare const intents: {
    name: string;
    patterns: RegExp[];
}[];
export declare const skills: {
    greet: () => Promise<string>;
    loan_inquiry: typeof handleLoanInquiry;
    exit: () => Promise<string>;
    unknown: () => Promise<string>;
};
//# sourceMappingURL=config.d.ts.map