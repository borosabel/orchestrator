import inquirer from 'inquirer';
import { slotDefinitions } from './slotDefinitions';

export async function collectSlots(intentName: string, preExtractedSlots: Record<string, any> = {}): Promise<Record<string, any>> {
    const slotsNeeded = slotDefinitions[intentName] || [];
    const collectedSlots: Record<string, any> = { ...preExtractedSlots };
    
    for (const slotDef of slotsNeeded) {
        // Skip if we already have this slot
        if (collectedSlots[slotDef.name]) {
            continue;
        }
        
        const prompt = {
            type: slotDef.type,
            name: slotDef.name,
            message: slotDef.message,
            ...(slotDef.choices && { choices: slotDef.choices }),
            ...(slotDef.validate && { validate: slotDef.validate })
        };
        
        const answer = await inquirer.prompt([prompt]);
        collectedSlots[slotDef.name] = answer[slotDef.name];
    }
    
    return collectedSlots;
} 