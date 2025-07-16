// Socket.IO connection
const socket = io();

// Graph visualization
let network = null;
let nodes = new vis.DataSet();
let edges = new vis.DataSet();
let nodeCounter = 0;
let currentSteps = {};
let sessionId = null;
let isProcessing = false;

// Step-by-step processing variables
let processingMode = 'auto'; // 'auto' or 'step'
let stepQueue = [];
let currentStepIndex = 0;
let isPaused = false;
let processingResult = null;

// DOM elements
const domainSelect = document.getElementById('domain-select');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const chatMessages = document.getElementById('chat-messages');
const sessionIdElement = document.getElementById('session-id');
const connectionStatus = document.getElementById('connection-status');
const domainInfo = document.getElementById('domain-info');

// Step control elements
const autoModeBtn = document.getElementById('auto-mode');
const stepModeBtn = document.getElementById('step-mode');
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const nextBtn = document.getElementById('next-btn');
const stepControls = document.getElementById('step-controls');
const modeIndicator = document.getElementById('mode-indicator');

// Information panel elements
const currentIntentElement = document.getElementById('current-intent');
const currentSlotsElement = document.getElementById('current-slots');
const memoryContextElement = document.getElementById('memory-context');
const stepDetailsElement = document.getElementById('step-details');
const infoCollapseBtn = document.getElementById('info-collapse');
const infoContent = document.getElementById('info-content');

// Graph configuration
const graphOptions = {
    layout: {
        hierarchical: {
            direction: 'LR', // Left to Right
            nodeSpacing: 200,
            treeSpacing: 250,
            blockShifting: true,
            edgeMinimization: true,
            parentCentralization: true,
            sortMethod: 'directed'
        }
    },
    physics: {
        enabled: false
    },
    nodes: {
        shape: 'circle',
        size: 40,
        margin: 15,
        font: {
            size: 11,
            color: '#000000',
            face: 'Arial',
            bold: true
        },
        borderWidth: 3,
        shadow: {
            enabled: true,
            color: 'rgba(0,0,0,0.1)',
            size: 10,
            x: 2,
            y: 2
        },
        chosen: {
            node: function(values, id, selected, hovering) {
                values.borderWidth = 5;
                values.borderColor = '#4299e1';
            }
        }
    },
    edges: {
        arrows: {
            to: { enabled: true, scaleFactor: 1.2 }
        },
        color: { 
            color: '#a0aec0',
            highlight: '#4299e1',
            hover: '#4299e1'
        },
        font: { size: 10 },
        smooth: {
            type: 'cubicBezier',
            forceDirection: 'horizontal',
            roundness: 0.6
        },
        width: 2
    },
    interaction: {
        dragNodes: true,
        dragView: true,
        zoomView: true,
        hover: true
    }
};

// Initialize graph
function initGraph() {
    const container = document.getElementById('graph');
    const data = { nodes: nodes, edges: edges };
    
    network = new vis.Network(container, data, graphOptions);
    
    // Graph event handlers
    network.on('click', function(params) {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const node = nodes.get(nodeId);
            showNodeDetails(node);
        }
    });
}

// Socket event handlers
socket.on('connect', () => {
    console.log('Connected to server');
    connectionStatus.textContent = 'Connected';
    connectionStatus.style.color = '#48bb78';
    
    // Start conversation automatically
    socket.emit('start-conversation', { userId: 'web-user' });
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    connectionStatus.textContent = 'Disconnected';
    connectionStatus.style.color = '#e53e3e';
    messageInput.disabled = true;
    sendButton.disabled = true;
});

socket.on('domain-info', (data) => {
    updateDomainInfo(data.current);
    
    // Populate domain selector with available domains
    if (data.available) {
        populateDomainSelector(data.available);
    }
    
    // Set current domain
    if (data.current) {
        domainSelect.value = data.current.name;
    }
    
    // Apply UI configuration if provided
    if (data.config) {
        applyUIConfig(data.config);
    }
});

socket.on('conversation-started', (data) => {
    sessionId = data.sessionId;
    sessionIdElement.textContent = sessionId.substring(0, 8) + '...';
    messageInput.disabled = false;
    sendButton.disabled = false;
    
    addSystemMessage(`Conversation started! Session ID: ${sessionId.substring(0, 8)}...`);
    
    // Initialize information panel
    clearInformationPanel();
    updateMemoryContext({
        contextLoaded: true,
        turns: 0,
        hasPreferences: false,
        hasSlotCollection: false
    });
    
    // Clear no-messages placeholder
    const noMessages = document.querySelector('.no-messages');
    if (noMessages) {
        noMessages.remove();
    }
});

socket.on('processing-started', (data) => {
    isProcessing = true;
    sendButton.disabled = true;
    messageInput.disabled = true;
    sendButton.textContent = 'Processing...';
    
    addUserMessage(data.message);
    addProcessingMessage();
    
    // Clear previous graph and info
    clearGraphData();
    clearInformationPanel();
    currentSteps = {};
    nodeCounter = 0;
    
    // Add user input node with better styling
    addGraphNode('USER', 'User Input', 'input', { input: data.message }, 'completed');
    
    // Auto-fit graph for user input
    if (network) {
        setTimeout(() => network.fit(), 100);
    }
});

socket.on('step-started', (data) => {
    if (processingMode === 'auto') {
        handleStepStarted(data);
    } else {
        // In step mode, queue the step with real data
        stepQueue.push({
            ...data,
            duration: Math.floor(Math.random() * 100) + 20
        });
        
        if (currentStepIndex === 0 && !isPaused) {
            executeNextStep();
        }
    }
});

function handleStepStarted(data) {
    const nodeId = addGraphNode(
        data.stepId,
        data.name,
        data.type,
        data.input,
        'running'
    );
    
    currentSteps[data.stepId] = {
        nodeId,
        startTime: Date.now(),
        ...data
    };
    
    // Connect to previous node
    connectToPreviousNode(nodeId);
}

socket.on('step-updated', (data) => {
    if (processingMode === 'auto') {
        handleStepUpdated(data);
    }
    // In step mode, this is handled by executeStep function
});

function handleStepUpdated(data) {
    const step = currentSteps[data.stepId];
    if (!step) return;
    
    // Update node
    updateGraphNode(step.nodeId, {
        status: data.status,
        output: data.output,
        duration: data.duration
    });
    
    // Update information panel based on step type and data
    updateInformationPanelFromStep(data);
    
    // Auto-fit graph when steps are added
    if (network) {
        setTimeout(() => network.fit(), 100);
    }
}

function updateInformationPanelFromStep(data) {
    console.log('Updating info panel from step:', data.stepId, data.output);
    
    // Update intent when detected
    if (data.stepId === 'INTENT' && data.output) {
        updateCurrentIntent(data.output);
    }
    
    // Update slots when extracted
    if (data.stepId === 'SLOTS' && data.output) {
        updateCurrentSlots(data.output);
    }
    
    // Update context information
    if (data.stepId === 'CONTEXT' && data.output) {
        updateMemoryContext(data.output);
    }
    
    // Show enhanced slots (final slots)
    if (data.stepId === 'ENHANCE' && data.output) {
        updateCurrentSlots(data.output);
    }
}

socket.on('processing-complete', (data) => {
    if (processingMode === 'step') {
        // Store result for step mode completion
        processingResult = data;
        return;
    }
    
    // Auto mode - complete immediately
    completeProcessing(data);
});

function completeProcessing(data) {
    isProcessing = false;
    sendButton.disabled = false;
    messageInput.disabled = false;
    sendButton.textContent = 'Send';
    
    // Remove processing message
    const processingMsg = document.querySelector('.processing');
    if (processingMsg) {
        processingMsg.remove();
    }
    
    // Add bot response
    addBotMessage(data.result.response);
    
    // Add metrics
    addMetrics(data.result);
    
    // Update final information panel with complete results
    updateCurrentIntent(data.result.intent);
    updateCurrentSlots(data.result.slots);
    if (data.result.context) {
        updateMemoryContext(data.result.context);
    }
    
    // Clear current steps tracking
    currentSteps = {};
    resetStepProcessing();
    
    // Final graph fit
    if (network) {
        setTimeout(() => {
            network.fit();
            // Add a slight zoom out for better overview
            network.moveTo({
                scale: 0.8
            });
        }, 300);
    }
    
    console.log('Processing completed successfully');
}

socket.on('error', (data) => {
    console.error('Socket error:', data);
    addSystemMessage(`Error: ${data.message}`, 'error');
    
    // Ensure processing state is cleared
    isProcessing = false;
    sendButton.disabled = false;
    messageInput.disabled = false;
    sendButton.textContent = 'Send';
    
    // Remove any processing messages
    const processingMsg = document.querySelector('.processing');
    if (processingMsg) {
        processingMsg.remove();
    }
    
    // Clear any incomplete graph data
    if (Object.keys(currentSteps).length > 0) {
        // Mark any pending steps as error
        Object.values(currentSteps).forEach(step => {
            updateGraphNode(step.nodeId, {
                status: 'error',
                output: 'Processing interrupted'
            });
        });
    }
});

socket.on('domain-changed', (data) => {
    updateDomainInfo(data.domainInfo);
    domainSelect.value = data.domain;
    addSystemMessage(`Switched to ${data.domain} domain`);
    
    // Clear graph and restart conversation
    clearGraphData();
    socket.emit('start-conversation', { userId: 'web-user' });
});

// Message handling
function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isProcessing) return;
    
    socket.emit('process-message', { message });
    messageInput.value = '';
}

// Event listeners
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

domainSelect.addEventListener('change', (e) => {
    const domain = e.target.value;
    fetch('/api/switch-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
    });
});

// Step control event listeners
autoModeBtn.addEventListener('click', () => {
    switchToAutoMode();
});

stepModeBtn.addEventListener('click', () => {
    switchToStepMode();
});

playBtn.addEventListener('click', () => {
    resumeProcessing();
});

pauseBtn.addEventListener('click', () => {
    pauseProcessing();
});

nextBtn.addEventListener('click', () => {
    executeNextStep();
});

// Info panel collapse functionality
infoCollapseBtn.addEventListener('click', () => {
    const isCollapsed = infoContent.style.display === 'none';
    infoContent.style.display = isCollapsed ? 'block' : 'none';
    infoCollapseBtn.textContent = isCollapsed ? '−' : '+';
});

// Step control functions
function switchToAutoMode() {
    processingMode = 'auto';
    autoModeBtn.classList.add('active');
    stepModeBtn.classList.remove('active');
    stepControls.style.display = 'none';
    modeIndicator.textContent = 'Auto Mode';
    
    // If we're in the middle of processing, continue automatically
    if (isProcessing && isPaused) {
        resumeProcessing();
    }
}

function switchToStepMode() {
    processingMode = 'step';
    stepModeBtn.classList.add('active');
    autoModeBtn.classList.remove('active');
    stepControls.style.display = 'flex';
    modeIndicator.textContent = 'Step Mode';
    
    // If we're processing, pause immediately
    if (isProcessing) {
        pauseProcessing();
    }
}

function pauseProcessing() {
    isPaused = true;
    playBtn.style.display = 'inline-block';
    pauseBtn.style.display = 'none';
    modeIndicator.textContent = 'Step Mode - Paused';
}

function resumeProcessing() {
    isPaused = false;
    playBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
    modeIndicator.textContent = 'Step Mode - Playing';
    
    // Continue with automatic step execution
    if (processingMode === 'step' && stepQueue.length > currentStepIndex) {
        executeStepsAutomatically();
    }
}

function executeNextStep() {
    if (stepQueue.length > currentStepIndex) {
        const step = stepQueue[currentStepIndex];
        executeStep(step);
        currentStepIndex++;
        
        updateStepIndicator();
        
        // If this was the last step, complete processing
        if (currentStepIndex >= stepQueue.length && processingResult) {
            completeStepProcessing();
        }
    }
}

function executeStepsAutomatically() {
    if (isPaused || processingMode === 'auto') return;
    
    if (stepQueue.length > currentStepIndex) {
        const step = stepQueue[currentStepIndex];
        executeStep(step);
        currentStepIndex++;
        
        updateStepIndicator();
        
        // Continue to next step after delay
        if (currentStepIndex < stepQueue.length && !isPaused) {
            setTimeout(() => executeStepsAutomatically(), 800);
        } else if (currentStepIndex >= stepQueue.length && processingResult) {
            completeStepProcessing();
        }
    }
}

function executeStep(step) {
    // Emit step started
    handleStepStarted(step);
    
    // After a delay, mark as completed
    setTimeout(() => {
        handleStepUpdated({
            stepId: step.stepId,
            status: 'completed',
            duration: step.duration,
            output: step.output
        });
    }, 200);
}

function updateStepIndicator() {
    const total = stepQueue.length;
    const current = currentStepIndex;
    modeIndicator.textContent = `Step Mode - ${current}/${total}`;
}

function completeStepProcessing() {
    if (processingResult) {
        // Complete processing using the stored result
        completeProcessing(processingResult);
    }
}

function resetStepProcessing() {
    stepQueue = [];
    currentStepIndex = 0;
    isPaused = false;
    processingResult = null;
    
    if (processingMode === 'step') {
        modeIndicator.textContent = 'Step Mode';
        playBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
    }
}

// UI helper functions
function addUserMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.innerHTML = `
        <div class="message-content">${escapeHtml(message)}</div>
        <div class="message-meta">${new Date().toLocaleTimeString()}</div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function addBotMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    messageDiv.innerHTML = `
        <div class="message-content">${escapeHtml(message)}</div>
        <div class="message-meta">${new Date().toLocaleTimeString()}</div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function addSystemMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message system ${type}`;
    messageDiv.innerHTML = `
        <div class="message-content">${escapeHtml(message)}</div>
        <div class="message-meta">${new Date().toLocaleTimeString()}</div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function addProcessingMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'processing';
    messageDiv.textContent = 'Processing';
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function addStepInfo(message, type = 'info') {
    const stepDiv = document.createElement('div');
    stepDiv.className = `step-info ${type}`;
    stepDiv.textContent = message;
    chatMessages.appendChild(stepDiv);
    scrollToBottom();
}

function addMetrics(result) {
    const metricsDiv = document.createElement('div');
    metricsDiv.className = 'metrics';
    metricsDiv.innerHTML = `
        <div class="metric">
            <div class="metric-value">${result.intent}</div>
            <div class="metric-label">Intent</div>
        </div>
        <div class="metric">
            <div class="metric-value">${result.processingTime}ms</div>
            <div class="metric-label">Processing Time</div>
        </div>
    `;
    chatMessages.appendChild(metricsDiv);
    scrollToBottom();
}

function updateDomainInfo(domainInfo) {
    if (!domainInfo) return;
    
    const domainInfoElement = document.getElementById('domain-info');
    if (domainInfoElement) {
        domainInfoElement.innerHTML = `
            <strong>${domainInfo.name}</strong> v${domainInfo.version}<br>
            <small>${domainInfo.description}</small><br>
            <small>Intents: ${domainInfo.intents?.map(i => i.name).join(', ') || 'Loading...'}</small>
        `;
    }
}

function populateDomainSelector(availableDomains) {
    domainSelect.innerHTML = '';
    
    // Add a mapping for domain icons (could come from config in the future)
    const domainIcons = {
        appointments: '🗓️',
        banking: '🏦',
        healthcare: '🏥'
    };
    
    availableDomains.forEach(domainKey => {
        const option = document.createElement('option');
        option.value = domainKey;
        const icon = domainIcons[domainKey] || '⚙️';
        const displayName = domainKey.charAt(0).toUpperCase() + domainKey.slice(1);
        option.textContent = `${icon} ${displayName}`;
        domainSelect.appendChild(option);
    });
}

function applyUIConfig(config) {
    // Apply default mode
    if (config.defaultMode === 'step') {
        switchToStepMode();
    } else {
        switchToAutoMode();
    }
    
    // Update title if provided
    if (config.title) {
        const titleElement = document.querySelector('.header h1');
        if (titleElement) {
            const statusSpan = titleElement.querySelector('.status');
            titleElement.innerHTML = `${config.title} ${statusSpan ? statusSpan.outerHTML : ''}`;
        }
    }
}

// Graph helper functions
function addGraphNode(id, label, type, input, status) {
    const nodeId = `node_${nodeCounter++}`;
    
    // Enhanced color scheme for better visual distinction
    const typeColors = {
        input: { background: '#4299e1', border: '#2b6cb0' },
        processing: { background: '#38b2ac', border: '#2c7a7b' },
        memory: { background: '#9f7aea', border: '#805ad5' },
        decision: { background: '#ed8936', border: '#dd6b20' },
        output: { background: '#48bb78', border: '#38a169' },
        intent: { background: '#f56565', border: '#e53e3e' },
        slot: { background: '#ec8943', border: '#d69e2e' },
        unknown: { background: '#a0aec0', border: '#718096' }
    };
    
    const statusColors = {
        pending: { background: '#f7fafc', border: '#cbd5e0' },
        running: { background: '#fed7d7', border: '#fc8181' },
        completed: { background: '#c6f6d5', border: '#48bb78' },
        error: { background: '#fed7d7', border: '#e53e3e' }
    };
    
    // Determine node size based on type
    const sizes = {
        input: 35,
        output: 35,
        processing: 30,
        memory: 25,
        decision: 32,
        intent: 30,
        slot: 28
    };
    
    const color = statusColors[status] || typeColors[type] || typeColors.processing;
    const size = sizes[type] || 30;
    
    // Create shorter labels for better display in circles
    const displayLabel = label.length > 10 ? label.substring(0, 8) + '...' : label;
    
    const node = {
        id: nodeId,
        label: displayLabel,
        title: `${label}\nType: ${type}\nStatus: ${status}`, // Enhanced tooltip
        color: color,
        size: size,
        font: { 
            size: 10,
            color: '#000000',
            face: 'Arial',
            bold: true,
            multi: false,
            align: 'center'
        },
        stepId: id,
        stepType: type,
        stepInput: input,
        stepStatus: status,
        borderWidth: 3
    };
    
    nodes.add(node);
    return nodeId;
}

function updateGraphNode(nodeId, updates) {
    const node = nodes.get(nodeId);
    if (!node) return;
    
    // Update status color with enhanced scheme
    if (updates.status) {
        const statusColors = {
            pending: { background: '#f7fafc', border: '#cbd5e0' },
            running: { background: '#fed7d7', border: '#fc8181' },
            completed: { background: '#c6f6d5', border: '#48bb78' },
            error: { background: '#fed7d7', border: '#e53e3e' }
        };
        
        node.color = statusColors[updates.status] || node.color;
        
        // Update title with duration if completed
        if (updates.status === 'completed' && updates.duration) {
            node.title = `${node.title} (${updates.duration}ms)`;
        }
    }
    
    // Store additional data
    node.stepOutput = updates.output;
    node.stepDuration = updates.duration;
    node.stepStatus = updates.status;
    
    nodes.update(node);
}

function connectToPreviousNode(nodeId) {
    const allNodes = nodes.get();
    if (allNodes.length < 2) return;
    
    // Connect to the previous node
    const previousNode = allNodes[allNodes.length - 2];
    const edgeId = `edge_${previousNode.id}_${nodeId}`;
    
    edges.add({
        id: edgeId,
        from: previousNode.id,
        to: nodeId,
        arrows: 'to'
    });
}

function clearGraphData() {
    nodes.clear();
    edges.clear();
    nodeCounter = 0;
}

function showNodeDetails(node) {
    let details = `<div class="step-detail">`;
    details += `<strong>Step:</strong> ${node.label || node.title}<br>`;
    details += `<strong>Type:</strong> ${node.stepType}<br>`;
    details += `<strong>Status:</strong> <span class="status-${node.stepStatus}">${node.stepStatus}</span><br>`;
    
    if (node.stepDuration) {
        details += `<strong>Duration:</strong> ${node.stepDuration}ms<br>`;
    }
    
    if (node.stepInput) {
        details += `<br><strong>Input:</strong><br><code>${JSON.stringify(node.stepInput, null, 2)}</code><br>`;
    }
    
    if (node.stepOutput) {
        details += `<br><strong>Output:</strong><br><code>${JSON.stringify(node.stepOutput, null, 2)}</code>`;
    }
    
    details += `</div>`;
    
    stepDetailsElement.innerHTML = details;
    
    // Highlight the selected node
    highlightSelectedNode(node.id);
}

function highlightSelectedNode(nodeId) {
    // Reset all nodes to default highlighting
    const allNodes = nodes.get();
    allNodes.forEach(node => {
        if (node.id === nodeId) {
            nodes.update({
                ...node, 
                borderWidth: 6,
                borderColor: '#4299e1',
                shadow: {
                    enabled: true,
                    color: 'rgba(66, 153, 225, 0.4)',
                    size: 15,
                    x: 3,
                    y: 3
                }
            });
        } else {
            nodes.update({
                ...node, 
                borderWidth: 3,
                borderColor: node.color.border,
                shadow: {
                    enabled: true,
                    color: 'rgba(0,0,0,0.1)',
                    size: 10,
                    x: 2,
                    y: 2
                }
            });
        }
    });
}

// Information panel update functions
function updateCurrentIntent(intent) {
    currentIntentElement.innerHTML = intent ? 
        `<span class="intent-value">${intent}</span>` : 
        '<span class="no-data">None detected</span>';
}

function updateCurrentSlots(slots) {
    if (!slots || Object.keys(slots).length === 0) {
        currentSlotsElement.innerHTML = '<span class="no-data">No slots extracted</span>';
        return;
    }
    
    let html = '<div class="slots-grid">';
    Object.entries(slots).forEach(([key, value]) => {
        html += `<div class="slot-item">`;
        html += `<strong>${key}:</strong> <span class="slot-value">${value}</span>`;
        html += `</div>`;
    });
    html += '</div>';
    
    currentSlotsElement.innerHTML = html;
}

function updateMemoryContext(context) {
    if (!context) {
        memoryContextElement.innerHTML = '<span class="no-data">No context loaded</span>';
        return;
    }
    
    let html = '<div class="context-info">';
    
    // Handle both detailed context objects and simple status objects
    if (typeof context === 'object') {
        if (context.turns !== undefined) {
            html += `<div><strong>Conversation turns:</strong> ${context.turns}</div>`;
        }
        
        if (context.hasPreferences !== undefined) {
            html += `<div><strong>User preferences:</strong> ${context.hasPreferences ? 'Available' : 'None'}</div>`;
        }
        
        if (context.hasSlotCollection !== undefined) {
            html += `<div><strong>Slot collection:</strong> ${context.hasSlotCollection ? 'In progress' : 'None'}</div>`;
        }
        
        if (context.contextLoaded !== undefined) {
            html += `<div><strong>Context status:</strong> ${context.contextLoaded ? 'Loaded' : 'Not loaded'}</div>`;
        }
        
        // Handle full context objects with turns array
        if (context.turns && Array.isArray(context.turns) && context.turns.length > 0) {
            html += `<div><strong>Conversation turns:</strong> ${context.turns.length}</div>`;
            html += `<div><strong>Last interaction:</strong> ${new Date(context.turns[context.turns.length - 1].timestamp).toLocaleTimeString()}</div>`;
        }
        
        if (context.preferences && typeof context.preferences === 'object') {
            html += `<div><strong>User preferences:</strong> Available</div>`;
        }
        
        if (context.slotCollection) {
            html += `<div><strong>Slot collection:</strong> In progress</div>`;
        }
    }
    
    html += '</div>';
    
    memoryContextElement.innerHTML = html || '<span class="no-data">No context data</span>';
}

function clearInformationPanel() {
    updateCurrentIntent(null);
    updateCurrentSlots({});
    updateMemoryContext(null);
    stepDetailsElement.innerHTML = 'Click a node to see details';
}

// Graph control functions
function fitGraph() {
    if (network) {
        network.fit();
    }
}

function clearGraph() {
    clearGraphData();
    currentSteps = {};
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    initGraph();
});

// Export for global access
window.fitGraph = fitGraph;
window.clearGraph = clearGraph; 