import { DomainConfig, RuntimeConfig, ConfigValidationResult, IntentDefinition, SlotDefinition } from './configSchema';

/**
 * Configuration loader and validator for domain configs
 */
export class ConfigLoader {
    private loadedConfigs: Map<string, RuntimeConfig> = new Map();
    private currentConfig: RuntimeConfig | null = null;

    /**
     * Load a domain configuration
     */
    async loadConfig(config: DomainConfig): Promise<RuntimeConfig> {
        console.log(`📦 Loading domain config: ${config.metadata.name}`);
        
        // Validate the configuration
        const validationResult = this.validateConfig(config);
        
        const runtimeConfig: RuntimeConfig = {
            ...config,
            loadedAt: new Date(),
            isValid: validationResult.isValid,
            validationResult
        };

        // Store the loaded config
        this.loadedConfigs.set(config.metadata.name, runtimeConfig);
        
        if (validationResult.isValid) {
            console.log(`✅ Successfully loaded domain: ${config.metadata.name}`);
            this.currentConfig = runtimeConfig;
        } else {
            console.error(`❌ Invalid domain config: ${config.metadata.name}`);
            console.error('Errors:', validationResult.errors);
        }

        return runtimeConfig;
    }

    /**
     * Get the currently active configuration
     */
    getCurrentConfig(): RuntimeConfig | null {
        return this.currentConfig;
    }

    /**
     * Switch to a different loaded configuration
     */
    switchToConfig(domainName: string): boolean {
        const config = this.loadedConfigs.get(domainName);
        if (config && config.isValid) {
            this.currentConfig = config;
            console.log(`🔄 Switched to domain: ${domainName}`);
            return true;
        }
        console.error(`❌ Cannot switch to domain: ${domainName} (not found or invalid)`);
        return false;
    }

    /**
     * Get all loaded domain names
     */
    getLoadedDomains(): string[] {
        return Array.from(this.loadedConfigs.keys());
    }

    /**
     * Validate a domain configuration
     */
    validateConfig(config: DomainConfig): ConfigValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Validate metadata
        if (!config.metadata.name) {
            errors.push('Domain name is required');
        }
        if (!config.metadata.version) {
            errors.push('Domain version is required');
        }
        if (!config.metadata.description) {
            warnings.push('Domain description is recommended');
        }

        // Validate intents
        if (!config.intents || config.intents.length === 0) {
            errors.push('At least one intent is required');
        } else {
            this.validateIntents(config.intents, errors, warnings);
        }

        // Validate slots
        this.validateSlots(config.slots, config.intents, errors, warnings);

        // Validate prompts
        this.validatePrompts(config.prompts, config.intents, errors, warnings);

        // Validate skills
        this.validateSkills(config.skills, config.intents, errors, warnings);

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    private validateIntents(intents: IntentDefinition[], errors: string[], warnings: string[]): void {
        const intentNames = new Set<string>();
        
        for (const intent of intents) {
            // Check for duplicate intent names
            if (intentNames.has(intent.name)) {
                errors.push(`Duplicate intent name: ${intent.name}`);
            }
            intentNames.add(intent.name);

            // Validate intent structure
            if (!intent.name) {
                errors.push('Intent name is required');
            }
            if (!intent.patterns || intent.patterns.length === 0) {
                errors.push(`Intent ${intent.name} must have at least one pattern`);
            }
            if (!intent.description) {
                warnings.push(`Intent ${intent.name} should have a description`);
            }
            if (!intent.skillHandler) {
                errors.push(`Intent ${intent.name} must specify a skill handler`);
            }
            if (!intent.slots) {
                intent.slots = []; // Default to empty array
            }
        }

        // Check for required system intents
        const systemIntents = ['greet', 'exit', 'unknown'];
        for (const systemIntent of systemIntents) {
            if (!intentNames.has(systemIntent)) {
                warnings.push(`System intent '${systemIntent}' is recommended`);
            }
        }
    }

    private validateSlots(slots: { [intentName: string]: SlotDefinition[] }, intents: IntentDefinition[], errors: string[], warnings: string[]): void {
        const intentNames = new Set(intents.map(i => i.name));

        // Check that all slot groups have corresponding intents
        for (const intentName in slots) {
            if (!intentNames.has(intentName)) {
                warnings.push(`Slot group '${intentName}' has no corresponding intent`);
            }

            // Validate individual slots
            const slotGroup = slots[intentName];
            const slotNames = new Set<string>();
            
            for (const slot of slotGroup) {
                if (slotNames.has(slot.name)) {
                    errors.push(`Duplicate slot name '${slot.name}' in intent '${intentName}'`);
                }
                slotNames.add(slot.name);

                if (!slot.name) {
                    errors.push(`Slot in intent '${intentName}' is missing name`);
                }
                if (!slot.message) {
                    errors.push(`Slot '${slot.name}' in intent '${intentName}' is missing message`);
                }
                if (!['input', 'list'].includes(slot.type)) {
                    errors.push(`Slot '${slot.name}' has invalid type: ${slot.type}`);
                }
                if (slot.type === 'list' && (!slot.choices || slot.choices.length === 0)) {
                    errors.push(`List slot '${slot.name}' must have choices`);
                }
            }
        }

        // Check that intents with slots have slot definitions
        for (const intent of intents) {
            if (intent.slots.length > 0 && !slots[intent.name]) {
                warnings.push(`Intent '${intent.name}' declares slots but has no slot definitions`);
            }
        }
    }

    private validatePrompts(prompts: any, intents: IntentDefinition[], errors: string[], warnings: string[]): void {
        if (!prompts.intentDetection) {
            errors.push('Intent detection prompt is required');
        }

        if (!prompts.slotExtraction) {
            prompts.slotExtraction = {}; // Default to empty object
        }

        // Check that intents requiring slot extraction have prompts
        for (const intent of intents) {
            if (intent.slots.length > 0 && !prompts.slotExtraction[intent.name]) {
                warnings.push(`Intent '${intent.name}' has slots but no slot extraction prompt`);
            }
        }
    }

    private validateSkills(skills: any, intents: IntentDefinition[], errors: string[], _warnings: string[]): void {
        if (!skills || typeof skills !== 'object') {
            errors.push('Skills object is required');
            return;
        }

        const skillNames = new Set(Object.keys(skills));
        
        // Check that all intents have corresponding skills
        for (const intent of intents) {
            if (!skillNames.has(intent.skillHandler)) {
                errors.push(`Intent '${intent.name}' references non-existent skill '${intent.skillHandler}'`);
            }
        }

        // Check that all skills are functions
        for (const [skillName, skillHandler] of Object.entries(skills)) {
            if (typeof skillHandler !== 'function') {
                errors.push(`Skill '${skillName}' must be a function`);
            }
        }
    }
}

// Singleton instance for global access
export const configLoader = new ConfigLoader(); 