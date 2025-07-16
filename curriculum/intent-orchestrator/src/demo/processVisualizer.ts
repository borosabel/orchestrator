import chalk from 'chalk';

export interface ProcessStep {
    id: string;
    name: string;
    type: 'input' | 'processing' | 'output' | 'decision' | 'memory';
    timestamp: Date;
    duration?: number;
    input?: any;
    output?: any;
    status: 'pending' | 'running' | 'completed' | 'error';
    metadata?: Record<string, any>;
}

export interface ProcessFlow {
    sessionId: string;
    domain: string;
    userInput: string;
    steps: ProcessStep[];
    startTime: Date;
    endTime?: Date;
    totalDuration?: number;
}

export class ProcessVisualizer {
    private flows: ProcessFlow[] = [];
    private currentFlow: ProcessFlow | null = null;

    /**
     * Start tracking a new process flow
     */
    startFlow(sessionId: string, domain: string, userInput: string): string {
        const flowId = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.currentFlow = {
            sessionId,
            domain,
            userInput,
            steps: [],
            startTime: new Date()
        };
        
        this.flows.push(this.currentFlow);
        return flowId;
    }

    /**
     * Add a step to the current flow
     */
    addStep(step: Omit<ProcessStep, 'timestamp' | 'status'>): void {
        if (!this.currentFlow) {
            throw new Error('No active flow. Call startFlow() first.');
        }

        const fullStep: ProcessStep = {
            ...step,
            timestamp: new Date(),
            status: 'pending'
        };

        this.currentFlow.steps.push(fullStep);
    }

    /**
     * Update step status
     */
    updateStep(stepId: string, updates: Partial<ProcessStep>): void {
        if (!this.currentFlow) return;

        const step = this.currentFlow.steps.find(s => s.id === stepId);
        if (step) {
            Object.assign(step, updates);
        }
    }

    /**
     * Complete the current flow
     */
    completeFlow(): void {
        if (!this.currentFlow) return;

        this.currentFlow.endTime = new Date();
        this.currentFlow.totalDuration = this.currentFlow.endTime.getTime() - this.currentFlow.startTime.getTime();
        this.currentFlow = null;
    }

    /**
     * Generate Mermaid sequence diagram
     */
    generateSequenceDiagram(flowIndex: number = -1): string {
        const flow = flowIndex === -1 ? this.flows[this.flows.length - 1] : this.flows[flowIndex];
        if (!flow) return '';

        let diagram = 'sequenceDiagram\n';
        diagram += '    participant U as User\n';
        diagram += '    participant O as Orchestrator\n';
        diagram += '    participant I as Intent Detector\n';
        diagram += '    participant S as Slot Extractor\n';
        diagram += '    participant M as Memory\n';
        diagram += '    participant SK as Skill Handler\n\n';

        // Add user input
        diagram += `    U->>O: "${flow.userInput}"\n`;

        // Add process steps
        flow.steps.forEach((step, index) => {
            const duration = step.duration ? ` (${step.duration}ms)` : '';
            
            switch (step.type) {
                case 'processing':
                    if (step.name.includes('Intent')) {
                        diagram += `    O->>I: Detect Intent${duration}\n`;
                        diagram += `    I-->>O: Intent: ${step.output || 'unknown'}\n`;
                    } else if (step.name.includes('Slot')) {
                        diagram += `    O->>S: Extract Slots${duration}\n`;
                        diagram += `    S-->>O: Slots: ${JSON.stringify(step.output || {})}\n`;
                    } else if (step.name.includes('Skill')) {
                        diagram += `    O->>SK: Execute Skill${duration}\n`;
                        diagram += `    SK-->>O: Response Generated\n`;
                    }
                    break;
                case 'memory':
                    diagram += `    O->>M: ${step.name}${duration}\n`;
                    diagram += `    M-->>O: Memory Updated\n`;
                    break;
                case 'decision':
                    diagram += `    Note over O: ${step.name}\n`;
                    break;
            }
        });

        // Add final response
        const lastStep = flow.steps[flow.steps.length - 1];
        if (lastStep && lastStep.output) {
            diagram += `    O-->>U: "${String(lastStep.output).substring(0, 50)}..."\n`;
        }

        return diagram;
    }

    /**
     * Generate Mermaid flowchart diagram
     */
    generateFlowchart(flowIndex: number = -1): string {
        const flow = flowIndex === -1 ? this.flows[this.flows.length - 1] : this.flows[flowIndex];
        if (!flow) return '';

        let diagram = 'flowchart TD\n';
        diagram += `    A[User Input: "${flow.userInput}"] --> B[Orchestrator]\n`;
        
        let nodeCounter = 2; // Starting from C (A and B are used)
        let lastNode = 'B';

        flow.steps.forEach((step, index) => {
            const currentNode = String.fromCharCode(65 + nodeCounter + index);
            const duration = step.duration ? `<br/>${step.duration}ms` : '';
            const status = step.status === 'completed' ? '✅' : step.status === 'error' ? '❌' : '⏳';
            
            let nodeShape = '';
            let nodeLabel = '';

            switch (step.type) {
                case 'processing':
                    nodeShape = `${currentNode}[${status} ${step.name}${duration}]`;
                    break;
                case 'decision':
                    nodeShape = `${currentNode}{${status} ${step.name}}`;
                    break;
                case 'memory':
                    nodeShape = `${currentNode}[(${status} ${step.name})]`;
                    break;
                case 'output':
                    nodeShape = `${currentNode}([${status} ${step.name}])`;
                    break;
                default:
                    nodeShape = `${currentNode}[${status} ${step.name}]`;
            }

            diagram += `    ${lastNode} --> ${nodeShape}\n`;
            lastNode = currentNode;
        });

        // Add styling
        diagram += '\n    classDef processing fill:#e1f5fe\n';
        diagram += '    classDef memory fill:#f3e5f5\n';
        diagram += '    classDef decision fill:#fff3e0\n';
        diagram += '    classDef output fill:#e8f5e8\n';

        return diagram;
    }

    /**
     * Generate state diagram showing conversation state changes
     */
    generateStateDiagram(flowIndex: number = -1): string {
        const flow = flowIndex === -1 ? this.flows[this.flows.length - 1] : this.flows[flowIndex];
        if (!flow) return '';

        let diagram = 'stateDiagram-v2\n';
        diagram += '    [*] --> Idle\n';
        diagram += '    Idle --> Processing: User Input\n';
        diagram += '    Processing --> IntentDetection: Analyze Text\n';
        diagram += '    IntentDetection --> SlotExtraction: Intent Found\n';
        diagram += '    SlotExtraction --> MemoryUpdate: Slots Extracted\n';
        diagram += '    MemoryUpdate --> SkillExecution: Memory Updated\n';
        diagram += '    SkillExecution --> ResponseGeneration: Skill Executed\n';
        diagram += '    ResponseGeneration --> Idle: Response Sent\n';
        
        // Add error states
        diagram += '    IntentDetection --> ErrorHandling: Unknown Intent\n';
        diagram += '    SlotExtraction --> SlotCollection: Missing Slots\n';
        diagram += '    SlotCollection --> SlotExtraction: More Input\n';
        diagram += '    ErrorHandling --> Idle: Error Response\n';

        return diagram;
    }

    /**
     * Display animated console visualization
     */
    async displayAnimatedFlow(flowIndex: number = -1, animationSpeed: number = 1000): Promise<void> {
        const flow = flowIndex === -1 ? this.flows[this.flows.length - 1] : this.flows[flowIndex];
        if (!flow) {
            console.log(chalk.red('❌ No flow data available'));
            return;
        }

        console.log(chalk.blue.bold('\n🎬 ANIMATED PROCESS FLOW'));
        console.log(chalk.blue('========================='));
        console.log(chalk.gray(`Domain: ${flow.domain} | Session: ${flow.sessionId}\n`));

        // Show initial state
        console.log(chalk.cyan('📝 User Input:'), chalk.white(`"${flow.userInput}"`));
        await this.sleep(animationSpeed);

        // Animate each step
        for (let i = 0; i < flow.steps.length; i++) {
            const step = flow.steps[i];
            const stepNumber = i + 1;
            
            // Show step starting
            console.log(chalk.yellow(`\n⏳ Step ${stepNumber}: ${step.name}`));
            await this.sleep(animationSpeed / 2);

            // Show step details
            if (step.input) {
                console.log(chalk.gray(`   Input: ${this.formatData(step.input)}`));
            }

            // Simulate processing time
            const processingTime = step.duration || 500;
            const dots = Math.min(Math.floor(processingTime / 200), 5);
            for (let j = 0; j < dots; j++) {
                process.stdout.write(chalk.yellow('.'));
                await this.sleep(200);
            }

            // Show completion
            const statusIcon = step.status === 'completed' ? '✅' : step.status === 'error' ? '❌' : '⏳';
            console.log(chalk.green(`\n   ${statusIcon} Completed in ${processingTime}ms`));
            
            if (step.output) {
                console.log(chalk.gray(`   Output: ${this.formatData(step.output)}`));
            }

            await this.sleep(animationSpeed / 2);
        }

        // Show final summary
        console.log(chalk.green.bold('\n🎉 FLOW COMPLETED'));
        console.log(chalk.green(`⏱️  Total Duration: ${flow.totalDuration}ms`));
        console.log(chalk.green(`📊 Steps Executed: ${flow.steps.length}`));
    }

    /**
     * Generate comprehensive process report
     */
    generateReport(flowIndex: number = -1): string {
        const flow = flowIndex === -1 ? this.flows[this.flows.length - 1] : this.flows[flowIndex];
        if (!flow) return 'No flow data available';

        let report = '';
        report += '📊 PROCESS EXECUTION REPORT\n';
        report += '============================\n\n';
        report += `🏷️  Domain: ${flow.domain}\n`;
        report += `🆔 Session: ${flow.sessionId}\n`;
        report += `📝 Input: "${flow.userInput}"\n`;
        report += `⏱️  Total Duration: ${flow.totalDuration}ms\n`;
        report += `📈 Steps: ${flow.steps.length}\n\n`;

        report += '🔄 EXECUTION TIMELINE\n';
        report += '=====================\n';

        flow.steps.forEach((step, index) => {
            const statusIcon = step.status === 'completed' ? '✅' : step.status === 'error' ? '❌' : '⏳';
            const duration = step.duration ? `(${step.duration}ms)` : '';
            
            report += `${index + 1}. ${statusIcon} ${step.name} ${duration}\n`;
            
            if (step.input) {
                report += `   📥 Input: ${this.formatData(step.input)}\n`;
            }
            if (step.output) {
                report += `   📤 Output: ${this.formatData(step.output)}\n`;
            }
            report += '\n';
        });

        // Performance analysis
        const completedSteps = flow.steps.filter(s => s.status === 'completed' && s.duration);
        if (completedSteps.length > 0) {
            const totalStepTime = completedSteps.reduce((sum, step) => sum + (step.duration || 0), 0);
            const avgStepTime = totalStepTime / completedSteps.length;
            const slowestStep = completedSteps.reduce((max, step) => 
                (step.duration || 0) > (max.duration || 0) ? step : max
            );

            report += '📈 PERFORMANCE ANALYSIS\n';
            report += '=======================\n';
            report += `⚡ Average Step Time: ${avgStepTime.toFixed(2)}ms\n`;
            report += `🐌 Slowest Step: ${slowestStep.name} (${slowestStep.duration}ms)\n`;
            report += `⏱️  Total Processing Time: ${totalStepTime}ms\n`;
            report += `💤 Overhead Time: ${(flow.totalDuration || 0) - totalStepTime}ms\n\n`;
        }

        return report;
    }

    /**
     * Get all flows
     */
    getFlows(): ProcessFlow[] {
        return this.flows;
    }

    /**
     * Clear all flows
     */
    clearFlows(): void {
        this.flows = [];
        this.currentFlow = null;
    }

    /**
     * Helper methods
     */
    private formatData(data: any): string {
        if (typeof data === 'string') {
            return data.length > 50 ? `${data.substring(0, 50)}...` : data;
        }
        const jsonStr = JSON.stringify(data);
        return jsonStr.length > 80 ? `${jsonStr.substring(0, 80)}...` : jsonStr;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Singleton instance
export const processVisualizer = new ProcessVisualizer(); 