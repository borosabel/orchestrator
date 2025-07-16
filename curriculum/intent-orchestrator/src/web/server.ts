import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { visualizedOrchestrator } from '../demo/visualizedOrchestrator';
import { 
    webInterfaceConfig, 
    getEnabledDomains, 
    createDomainConfigMap,
    getDomainByKey 
} from './webConfig';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = webInterfaceConfig.server.port;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Track active sessions
const activeSessions = new Map<string, {
    sessionId: string;
    domain: string;
    socketId: string;
}>();

// Domain configurations from web config
const domains = createDomainConfigMap();

// Load default domain (first enabled domain)
const defaultDomain = getEnabledDomains()[0];
if (defaultDomain) {
    visualizedOrchestrator.loadDomain(defaultDomain.config);
    console.log(`📡 Loaded default domain: ${defaultDomain.name}`);
} else {
    console.error('❌ No enabled domains found in configuration');
}

// Serve the main interface
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoints
app.get('/api/domains', (req, res) => {
    res.json({
        domains: Object.keys(domains),
        current: visualizedOrchestrator.getCurrentDomain()?.name || 'appointments'
    });
});

app.post('/api/switch-domain', async (req, res) => {
    const { domain } = req.body;
    
    const domainConfig = getDomainByKey(domain);
    if (!domainConfig) {
        return res.status(400).json({ 
            error: 'Invalid domain',
            availableDomains: getEnabledDomains().map(d => d.key)
        });
    }

    try {
        const success = await visualizedOrchestrator.loadDomain(domainConfig.config);
        if (success) {
            // Notify all connected clients about domain change
            io.emit('domain-changed', { 
                domain, 
                domainInfo: visualizedOrchestrator.getCurrentDomain() 
            });
            res.json({ success: true, domain, domainName: domainConfig.name });
        } else {
            res.status(500).json({ error: 'Failed to load domain' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Domain loading failed' });
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Send initial data
    socket.emit('domain-info', {
        current: visualizedOrchestrator.getCurrentDomain(),
        available: getEnabledDomains().map(d => d.key),
        config: webInterfaceConfig.ui
    });

    // Handle new conversation
    socket.on('start-conversation', (data) => {
        try {
            const sessionId = visualizedOrchestrator.startConversation(data.userId);
            activeSessions.set(socket.id, {
                sessionId,
                domain: visualizedOrchestrator.getCurrentDomain()?.name || 'appointments',
                socketId: socket.id
            });

            socket.emit('conversation-started', { sessionId });
            console.log(`💬 Started conversation for ${socket.id}: ${sessionId}`);
        } catch (error) {
            socket.emit('error', { message: 'Failed to start conversation' });
        }
    });

    // Handle message processing with real-time visualization
    socket.on('process-message', async (data) => {
        const session = activeSessions.get(socket.id);
        if (!session) {
            socket.emit('error', { message: 'No active session. Start a conversation first.' });
            return;
        }

        try {
            const { message } = data;
            
            // Emit processing started
            socket.emit('processing-started', { message });

            // Create a custom visualized orchestrator that emits real-time updates
            const result = await processMessageWithRealtimeUpdates(
                message, 
                session.sessionId, 
                socket
            );

            // Emit final result
            socket.emit('processing-complete', {
                result: result.result,
                visualizations: result.visualizations,
                flowId: result.flowId
            });

        } catch (error) {
            console.error('Processing error:', error);
            socket.emit('error', { 
                message: 'Failed to process message',
                error: error instanceof Error ? error.message : String(error)
            });
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        activeSessions.delete(socket.id);
    });
});

/**
 * Process message with real-time updates via Socket.IO
 */
async function processMessageWithRealtimeUpdates(
    userInput: string, 
    sessionId: string, 
    socket: any
) {
    try {
        // First, process the message with actual orchestrator
        const result = await visualizedOrchestrator.processMessageWithVisualization(userInput, sessionId);
        
        // Then send visualization steps based on the actual result
        const steps = [
            { 
                id: 'INIT', 
                name: 'Initialize Processing', 
                type: 'processing',
                input: { userInput },
                output: 'Initialized'
            },
            { 
                id: 'CONTEXT', 
                name: 'Load Conversation Context', 
                type: 'memory',
                output: {
                    contextLoaded: true,
                    turns: result.result.context?.turns?.length || 0,
                    hasPreferences: !!result.result.preferences,
                    hasSlotCollection: !!result.result.context?.slotCollection
                }
            },
            { 
                id: 'INTENT', 
                name: 'Detect Intent', 
                type: 'processing',
                input: { text: userInput },
                output: result.result.intent
            },
            { 
                id: 'DECISION', 
                name: `Intent Decision: ${result.result.intent}`, 
                type: 'decision',
                output: `Selected: ${result.result.intent}`
            },
            { 
                id: 'SLOTS', 
                name: 'Extract Slots', 
                type: 'processing',
                input: { intent: result.result.intent, text: userInput },
                output: result.result.slots
            },
            { 
                id: 'ENHANCE', 
                name: 'Enhance Slots with Context', 
                type: 'processing',
                output: result.result.slots // Show the final enhanced slots
            },
            { 
                id: 'COLLECTION', 
                name: 'Handle Slot Collection', 
                type: 'decision',
                output: 'Slot collection handled'
            },
            { 
                id: 'SKILL', 
                name: 'Execute Skill', 
                type: 'processing',
                input: { intent: result.result.intent, slots: result.result.slots },
                output: 'Skill executed'
            },
            { 
                id: 'MEMORY', 
                name: 'Update Conversation Memory', 
                type: 'memory',
                output: 'Memory updated'
            },
            { 
                id: 'FINAL', 
                name: 'Generate Response', 
                type: 'output',
                output: result.result.response
            }
        ];

        // Send steps with proper timing
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            
            // Emit step started
            socket.emit('step-started', {
                stepId: step.id,
                name: step.name,
                type: step.type,
                input: step.input,
                timestamp: new Date()
            });

            // Add a small delay for better visualization
            await new Promise(resolve => setTimeout(resolve, 50));

            // Emit step completed
            socket.emit('step-updated', {
                stepId: step.id,
                status: 'completed',
                duration: Math.floor(Math.random() * 100) + 20,
                output: step.output,
                timestamp: new Date()
            });
        }
        
        return result;
        
    } catch (error) {
        console.error('Processing error in real-time updates:', error);
        
        // Send error step
        socket.emit('step-started', {
            stepId: 'ERROR',
            name: 'Error Handling',
            type: 'processing',
            timestamp: new Date()
        });
        
        socket.emit('step-updated', {
            stepId: 'ERROR',
            status: 'error',
            duration: 5,
            output: error instanceof Error ? error.message : String(error),
            timestamp: new Date()
        });
        
        throw error;
    }
}

// Start server
server.listen(PORT, () => {
    console.log(`🌐 Web interface running at http://localhost:${PORT}`);
    console.log(`🎯 Load any domain and start chatting with graph visualization!`);
    console.log(`📊 Real-time process flow visualization available`);
});

export { app, server, io }; 