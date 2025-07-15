// Core configuration schema for the generic orchestrator

/**
 * Validation function type for slot inputs
 */
export type SlotValidator = (input: string) => boolean | string;

/**
 * Slot definition within a domain configuration
 */
export interface SlotDefinition {
    name: string;
    message: string;
    type: 'input' | 'list';
    choices?: string[];
    validate?: SlotValidator;
    required?: boolean;
    description?: string;
}

/**
 * Intent definition within a domain configuration
 */
export interface IntentDefinition {
    name: string;
    patterns: RegExp[];
    description: string;
    skillHandler: string;
    slots: string[];
    examples?: string[];
}

/**
 * Prompt templates for LangChain operations
 */
export interface PromptTemplates {
    intentDetection: string;
    slotExtraction: {
        [intentName: string]: string;
    };
}

/**
 * Skill handler function type
 */
export type SkillHandler = (extractedSlots: Record<string, any>) => Promise<string>;

/**
 * Complete domain configuration
 */
export interface DomainConfig {
    metadata: {
        name: string;
        version: string;
        description: string;
        author?: string;
        created?: string;
    };
    
    intents: IntentDefinition[];
    
    slots: {
        [intentName: string]: SlotDefinition[];
    };
    
    prompts: PromptTemplates;
    
    skills: {
        [skillName: string]: SkillHandler;
    };
    
    // Optional advanced configuration
    options?: {
        fallbackIntent?: string;
        maxSlotRetries?: number;
        enableConversationMemory?: boolean;
        modelConfig?: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
        };
    };
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Runtime configuration after loading and validation
 */
export interface RuntimeConfig extends DomainConfig {
    loadedAt: Date;
    isValid: boolean;
    validationResult: ConfigValidationResult;
} 