# Orchestrator Agent

A LangChain TypeScript project for building and learning about orchestrator agents. This project provides a solid foundation for developing AI agents that can coordinate multiple tasks and tools.

## Features

- **TypeScript**: Full TypeScript support with strict type checking
- **LangChain**: Latest LangChain libraries for building AI applications
- **Multiple LLM Support**: OpenAI, Anthropic, and other providers
- **Development Tools**: ESLint, Jest testing, and hot reload
- **Project Structure**: Organized folders for agents, tools, memory, and utilities

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- API keys for your chosen LLM providers

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

**Note**: If you encounter dependency resolution conflicts (common with LangChain packages), the project includes an `.npmrc` file with `legacy-peer-deps=true` to resolve these issues. If you still have problems, you can also try:

```bash
npm install --legacy-peer-deps
```

### 2. Environment Setup

Copy the environment example file:

```bash
cp env.example .env
```

Edit `.env` and add your API keys:

```env
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 3. Development

Start the development server with hot reload:

```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
orchestrator/
├── src/                    # Source code
│   ├── agents/            # Agent implementations
│   ├── tools/             # Custom tools and utilities
│   ├── memory/            # Memory and persistence
│   └── utils/             # Utility functions
├── examples/              # Example implementations
├── tests/                 # Test files
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run type-check` - Run TypeScript type checking

## LangChain Resources

- [LangChain Documentation](https://docs.langchain.com/)
- [LangChain TypeScript Docs](https://js.langchain.com/)
- [LangChain Examples](https://github.com/langchain-ai/langchainjs/tree/main/examples)

## Getting Started with Orchestrator Agents

An orchestrator agent is a powerful pattern for coordinating multiple AI tasks. Here are some key concepts:

### 1. Agent Architecture
- **Planning**: Break down complex tasks into manageable steps
- **Execution**: Execute tasks using appropriate tools and sub-agents
- **Monitoring**: Track progress and handle errors
- **Adaptation**: Adjust plans based on results

### 2. Common Use Cases
- Multi-step workflows
- Tool coordination
- Data processing pipelines
- Decision-making systems
- Automated task management

### 3. Key Components
- **Orchestrator**: Main coordination logic
- **Tools**: Functions the agent can use
- **Memory**: Persistent storage for context
- **Utilities**: Helper functions and logging

## Contributing

This is a learning project! Feel free to:
- Add new agent implementations
- Create custom tools
- Improve error handling
- Add more examples
- Enhance documentation

## License

MIT License - feel free to use this for learning and development! 