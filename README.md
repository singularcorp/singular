# Singular AI Systems

A sophisticated autonomous agent framework implementing verifiable state machines and evolving personas with cryptographic proofs.

![banner](https://github.com/user-attachments/assets/0caf7c05-d639-4828-8cba-8c0156929280)

## Overview

Singular AI Systems is a TypeScript-based framework for creating autonomous AI agents with verifiable state transitions and evolving personas. The system combines cryptographic verification, state machine patterns, and dynamic persona evolution to create reliable and adaptable AI agents.

### Key Features

- **Cryptographically Verifiable State Machines**: Every state transition is cryptographically signed and stored in a Merkle tree
- **Evolving Persona System**: Agents can develop and adapt their personalities over time
- **Knowledge Integration**: Built-in Wikipedia scraping and topic tree generation
- **Multi-Agent Swarms**: Support for running multiple coordinated agents
- **Comprehensive Logging**: Detailed ASCII art logging system with state transition tracking

## Architecture

The system is built on several core components:

### State Machine Core (`sm.ts`)
- Implements a generic state machine with cryptographic verification
- Uses Merkle trees for state history verification
- Supports arbitrary state definitions and transition rules

### Persona Management (`persona.ts`)
- Manages agent personalities and traits
- Implements evolutionary algorithms for persona development
- Supports versioned tree-based persona history

### Knowledge Systems
- Wikipedia integration for knowledge gathering
- Topic tree generation and management
- Support for multiple knowledge source types

### Logging and Monitoring (`logger.ts`)
- Beautiful ASCII art logging
- State transition tracking
- Cryptographic proof verification

## Getting Started

### Prerequisites

```bash
# Node.js v18+ required
node -v

# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file with:

```env
CLAUDE_API_KEY=xxxx
IPFS_KEY=xxxx
POSTGRES_URL=xxxx
RAGIE_API_KEY=xxxx
RAGIE_API_KEY=xxxx
HELIS_SOLANA_URL=xxxx
HELIS_SOLANA_API_KEY=xxxx
```

### Basic Usage

```typescript
// Create a new persona agent
const agent = new PersonaSubAgent(
    "agent_id",
    "session_id",
    privateKeyHex
);

// Initialize with default persona
await agent.start(defaultPersona);

// Monitor state transitions
agent.getCurrentState();
agent.getEvolutionHistory();
```

### Running a Swarm

```typescript
import { startSwarm } from './swarm';

// Start multiple agents
await startSwarm(
    privateKeyHex,
    initialPersona,
    numAgents,
    "SWARM_PREFIX"
);
```

## State Machine Verification

The system uses cryptographic proofs for all state transitions:

```typescript
interface Proof {
    stateHash: string;     // Hash of current state
    prevHash: string;      // Hash of previous state
    merkleRoot: string;    // Root of Merkle tree
    merkleProof: string[]; // Proof path
    signature: string;     // Cryptographic signature
    timestamp: number;     // Proof generation time
}
```

## Persona Evolution

Personas evolve through a tree-based structure:

```typescript
interface PersonaStateData {
    personalityTraits: string[];
    goals: string[];
    interests: string[];
    background: string[];
    skills: string[];
    lore: string[];
    memories: string[];
    learnings: string[];
    patterns: string[];
    values: string[];
    prompt: string;
}
```

## API Endpoints

### Swarm Management

```
POST /start
{
    "privateKeyHex": string,
    "initialPersona": PersonaStateData,
    "numAgents": number,
    "agentPrefix": string
}

POST /end
```

## Database Schema

The system requires PostgreSQL with the following tables:

- `agent_personas`: Stores persona states and evolution history
- `execution_logs`: Stores state transition logs and proofs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Testing

```bash
npm test
```

## License

MIT License - see LICENSE file for details

## Technical Documentation

For detailed technical documentation, see:

- [State Machine Documentation](docs/state-machine.md)
- [Persona System](docs/persona-system.md)
- [Knowledge Integration](docs/knowledge-integration.md)
- [Cryptographic Verification](docs/crypto-verification.md)

## Credits

This project uses several key technologies:

- [Anthropic Claude API](https://www.anthropic.com/claude) for LLM integration
- [MerkleTreeJS](https://github.com/miguelmota/merkletreejs) for cryptographic proofs
- [Express](https://expressjs.com/) for API endpoints
- [PostgreSQL](https://www.postgresql.org/) for state storage

## Contact

For questions and support, please open an issue on GitHub.
