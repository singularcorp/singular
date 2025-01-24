/**
 * Swarm management module for coordinating multiple persona subagents
 * Handles initialization, coordination, and lifecycle management of agent swarms
 * @module swarm
 */

import { PersonaSubAgent } from "src/agent/subagents/persona";
import { Worker } from 'worker_threads';
import path from 'path';
import { AgentMailbox, AgentMessage, MessageResponse } from './mailbox';
import { Agent, getAgentById } from '../agent/agent';
import { SwarmPersistence } from './persistence';
import { AgentStatus } from './types';

/**
 * Starts a swarm of persona subagents running concurrently
 * Creates and initializes multiple agents with shared configuration
 * 
 * @param privateKeyHex - Hex-encoded private key for agent authentication
 * @param initialPersona - Initial persona configuration for all agents
 * @param numAgents - Number of subagents to create (default: 2)
 * @param agentPrefix - Prefix for agent names (default: "PERSONA_SUBAGENT")
 * @returns Promise that resolves when all subagents are started
 * 
 * @example
 * ```typescript
 * await startSwarm(
 *   privateKey,
 *   defaultPersona,
 *   3,
 *   "RESEARCH_AGENT"
 * );
 * ```
 */
export async function startSwarm(
    privateKeyHex: string, 
    initialPersona: any,
    numAgents: number = 2,
    agentPrefix: string = "PERSONA_SUBAGENT"
) {
    // Create array of persona subagents with sequential IDs
    const personas = Array.from({length: numAgents}, (_, i) => {
        const agentName = i === 0 ? agentPrefix : `${agentPrefix}_${i}`;
        return new PersonaSubAgent(i.toString(), agentName, privateKeyHex);
    });

    // Start all personas concurrently and wait for completion
    return Promise.all(
        personas.map(persona => persona.start(initialPersona))
    );
}

export class SwarmManager {
    private workers: Map<string, Worker>;
    private mailbox: AgentMailbox;
    private activeAgents: Set<string>;
    private persistence: SwarmPersistence;

    constructor() {
        this.workers = new Map();
        this.mailbox = new AgentMailbox();
        this.activeAgents = new Set();
        this.persistence = new SwarmPersistence();
    }

    /**
     * Initializes swarm manager and restores previous state
     */
    async initialize(): Promise<void> {
        try {
            // Get all agents that were active before shutdown
            const activeAgents = await this.persistence.getActiveAgents();
            
            // Restart each previously active agent
            for (const agentState of activeAgents) {
                try {
                    const agent = await getAgentById(agentState.id, agentState.userId);
                    if (agent) {
                        await this.startAgent(agent);
                        await this.persistence.addLog({
                            agentId: agent.id,
                            type: 'info',
                            message: 'Agent restored after system restart'
                        });
                    }
                } catch (error) {
                    await this.persistence.addLog({
                        agentId: agentState.id,
                        type: 'error',
                        message: 'Failed to restore agent',
                        metadata: { error: error.message }
                    });
                }
            }
        } catch (error) {
            console.error('Failed to initialize swarm manager:', error);
        }
    }

    /**
     * Starts a new agent in the swarm
     */
    async startAgent(agent: Agent): Promise<void> {
        try {
            if (this.activeAgents.has(agent.id)) {
                throw new Error('Agent already running');
            }

            // Update database state
            await this.persistence.upsertAgentState({
                id: agent.id,
                userId: agent.userId,
                status: 'starting',
                lastActive: new Date(),
                metadata: {}
            });

            // Create worker thread for agent
            const worker = new Worker(path.join(__dirname, 'worker.js'), {
                workerData: {
                    agentId: agent.id,
                    name: agent.name,
                    privateKeyHex: process.env.AGENT_PRIVATE_KEY,
                    persona: agent.initialPersona
                }
            });

            // Set up message handling
            worker.on('message', async (message: any) => {
                if (message.type === 'ready') {
                    this.activeAgents.add(agent.id);
                    await this.persistence.updateAgentStatus(agent.id, 'running');
                } else if (message.messageId) {
                    this.mailbox.sendResponse(message.messageId, message);
                }
            });

            worker.on('error', async (error) => {
                console.error(`Worker error for agent ${agent.id}:`, error);
                await this.persistence.addLog({
                    agentId: agent.id,
                    type: 'error',
                    message: 'Worker error',
                    metadata: { error: error.message }
                });
                await this.stopAgent(agent.id);
            });

            worker.on('exit', async (code) => {
                if (code !== 0) {
                    await this.persistence.addLog({
                        agentId: agent.id,
                        type: 'warning',
                        message: `Worker stopped with exit code ${code}`
                    });
                }
                await this.stopAgent(agent.id);
            });

            // Register agent with mailbox
            this.mailbox.registerAgent(agent.id);
            this.mailbox.onMessage(agent.id, (message) => {
                worker.postMessage(message);
            });

            this.workers.set(agent.id, worker);

            // Wait for agent to be ready
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(async () => {
                    await this.persistence.updateAgentStatus(
                        agent.id,
                        'error',
                        'Agent startup timeout'
                    );
                    reject(new Error('Agent startup timeout'));
                }, 30000);

                worker.once('message', (message) => {
                    if (message.type === 'ready') {
                        clearTimeout(timeout);
                        resolve();
                    }
                });
            });

        } catch (error) {
            await this.persistence.updateAgentStatus(
                agent.id,
                'error',
                error.message
            );
            throw error;
        }
    }

    /**
     * Stops an agent and cleans up resources
     */
    async stopAgent(agentId: string): Promise<void> {
        const worker = this.workers.get(agentId);
        if (worker) {
            worker.terminate();
            this.workers.delete(agentId);
            this.mailbox.unregisterAgent(agentId);
            this.activeAgents.delete(agentId);
        }
    }

    /**
     * Sends a message to a specific agent
     */
    async sendMessage(agentId: string, message: AgentMessage): Promise<MessageResponse> {
        if (!this.activeAgents.has(agentId)) {
            throw new Error('Agent not active');
        }
        return await this.mailbox.sendMessage(agentId, message);
    }

    /**
     * Checks if an agent is currently active
     */
    isAgentActive(agentId: string): boolean {
        return this.activeAgents.has(agentId);
    }

    /**
     * Gets the number of active agents
     */
    getActiveAgentCount(): number {
        return this.activeAgents.size;
    }

    /**
     * Gracefully shuts down the swarm manager
     */
    async shutdown(): Promise<void> {
        try {
            // Log shutdown initiation
            for (const agentId of this.activeAgents) {
                await this.persistence.addLog({
                    agentId,
                    type: 'info',
                    message: 'Initiating graceful shutdown'
                });
            }

            // Stop all agents
            const stopPromises = Array.from(this.workers.keys()).map(agentId => 
                this.stopAgent(agentId)
            );
            await Promise.all(stopPromises);

        } catch (error) {
            console.error('Error during shutdown:', error);
        }
    }
}

// Create and initialize singleton instance
export const swarmManager = new SwarmManager();
swarmManager.initialize().catch(console.error);
