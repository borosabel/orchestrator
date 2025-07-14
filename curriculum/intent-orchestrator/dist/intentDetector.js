"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectIntent = detectIntent;
const config_1 = require("./config");
function detectIntent(text) {
    for (const intent of config_1.intents) {
        if (intent.patterns.some(pat => pat.test(text))) {
            return intent.name;
        }
    }
    return 'unknown';
}
//# sourceMappingURL=intentDetector.js.map