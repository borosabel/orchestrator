import {intents} from "./config";

export function detectIntent(text: string) {
    for (const intent of intents) {
        if (intent.patterns.some(pat => pat.test(text))) {
            return intent.name;
        }
    }
    return 'unknown';
}