import { appointmentDomainConfig } from '../domains/appointments.config';
import { bankingDomainConfig } from '../domains/banking.config';
import { healthcareDomainConfig } from '../domains/healthcare.config';

/**
 * Web Interface Configuration
 * 
 * This configuration file allows easy setup and customization of the web interface
 * including domains, models, UI settings, and processing options.
 */

export interface WebDomainConfig {
    key: string;
    name: string;
    icon: string;
    description: string;
    config: any;
    enabled: boolean;
}

export interface WebModelConfig {
    name: string;
    provider: 'openai' | 'anthropic' | 'local';
    model: string;
    temperature: number;
    maxTokens: number;
    apiKey?: string;
    enabled: boolean;
}

export interface WebUIConfig {
    title: string;
    subtitle: string;
    theme: 'light' | 'dark' | 'auto';
    showMetrics: boolean;
    showNodeDetails: boolean;
    autoFitGraph: boolean;
    defaultMode: 'auto' | 'step';
    stepDelay: number; // milliseconds between steps in auto mode
}

export interface WebProcessingConfig {
    enableRealTimeVisualization: boolean;
    enableStepByStepMode: boolean;
    enableConversationMemory: boolean;
    maxRetries: number;
    timeoutMs: number;
}

export interface WebInterfaceConfig {
    domains: WebDomainConfig[];
    models: WebModelConfig[];
    ui: WebUIConfig;
    processing: WebProcessingConfig;
    server: {
        port: number;
        cors: boolean;
        enableHttps: boolean;
    };
}

/**
 * Default Web Interface Configuration
 * 
 * Modify this configuration to customize your web interface setup
 */
export const webInterfaceConfig: WebInterfaceConfig = {
    // Available domains - Add or remove domains here
    domains: [
        {
            key: 'appointments',
            name: 'Appointments',
            icon: '🗓️',
            description: 'Appointment booking and management system',
            config: appointmentDomainConfig,
            enabled: true
        },
        {
            key: 'banking',
            name: 'Banking',
            icon: '🏦',
            description: 'Banking services and financial operations',
            config: bankingDomainConfig,
            enabled: true
        },
        {
            key: 'healthcare',
            name: 'Healthcare',
            icon: '🏥',
            description: 'Healthcare patient portal and medical services',
            config: healthcareDomainConfig,
            enabled: true
        }
    ],

    // Model configurations - Add different models here
    models: [
        {
            name: 'GPT-3.5 Turbo',
            provider: 'openai',
            model: 'gpt-3.5-turbo',
            temperature: 0.1,
            maxTokens: 500,
            enabled: true
        },
        {
            name: 'GPT-4',
            provider: 'openai',
            model: 'gpt-4',
            temperature: 0.1,
            maxTokens: 500,
            enabled: false // Enable if you have GPT-4 access
        },
        {
            name: 'Claude 3.5 Sonnet',
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-20241022',
            temperature: 0.1,
            maxTokens: 500,
            enabled: false // Enable if you have Anthropic API access
        }
    ],

    // UI configuration
    ui: {
        title: '🤖 Orchestrator Visualization',
        subtitle: 'Interactive Process Flow Analysis',
        theme: 'light',
        showMetrics: true,
        showNodeDetails: true,
        autoFitGraph: true,
        defaultMode: 'auto', // 'auto' or 'step'
        stepDelay: 800 // milliseconds between auto steps
    },

    // Processing configuration
    processing: {
        enableRealTimeVisualization: true,
        enableStepByStepMode: true,
        enableConversationMemory: true,
        maxRetries: 3,
        timeoutMs: 30000
    },

    // Server configuration
    server: {
        port: 3000,
        cors: true,
        enableHttps: false
    }
};

/**
 * Get enabled domains
 */
export function getEnabledDomains(): WebDomainConfig[] {
    return webInterfaceConfig.domains.filter(domain => domain.enabled);
}

/**
 * Get enabled models
 */
export function getEnabledModels(): WebModelConfig[] {
    return webInterfaceConfig.models.filter(model => model.enabled);
}

/**
 * Get domain by key
 */
export function getDomainByKey(key: string): WebDomainConfig | undefined {
    return webInterfaceConfig.domains.find(domain => domain.key === key && domain.enabled);
}

/**
 * Get current model (first enabled model)
 */
export function getCurrentModel(): WebModelConfig | undefined {
    return webInterfaceConfig.models.find(model => model.enabled);
}

/**
 * Create domain configuration object for the orchestrator
 */
export function createDomainConfigMap(): Record<string, any> {
    const configMap: Record<string, any> = {};
    getEnabledDomains().forEach(domain => {
        configMap[domain.key] = domain.config;
    });
    return configMap;
}

/**
 * Custom domain configuration factory
 * Use this to create custom domain configurations on the fly
 */
export function createCustomDomain(
    key: string,
    name: string,
    icon: string,
    config: any
): WebDomainConfig {
    return {
        key,
        name,
        icon,
        description: `Custom domain: ${name}`,
        config,
        enabled: true
    };
}

/**
 * Environment-based configuration override
 * Override settings based on environment variables
 */
export function applyEnvironmentOverrides(): void {
    // Override port from environment
    if (process.env.PORT) {
        webInterfaceConfig.server.port = parseInt(process.env.PORT);
    }

    // Override HTTPS setting
    if (process.env.ENABLE_HTTPS === 'true') {
        webInterfaceConfig.server.enableHttps = true;
    }

    // Override default mode
    if (process.env.DEFAULT_MODE === 'step') {
        webInterfaceConfig.ui.defaultMode = 'step';
    }

    // Enable/disable specific domains
    if (process.env.ENABLED_DOMAINS) {
        const enabledKeys = process.env.ENABLED_DOMAINS.split(',');
        webInterfaceConfig.domains.forEach(domain => {
            domain.enabled = enabledKeys.includes(domain.key);
        });
    }
}

// Apply environment overrides on import
applyEnvironmentOverrides();

export default webInterfaceConfig; 