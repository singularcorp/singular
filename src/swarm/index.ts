/**
 * Swarm management module for coordinating multiple persona subagents
 * Handles initialization, coordination, and lifecycle management of agent swarms
 * @module swarm
 */

import { PersonaSubAgent } from "src/agent/persona";

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
