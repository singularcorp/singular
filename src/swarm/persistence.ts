import sql from '../utils/sql';
import { randomBytes } from 'crypto';
import { SwarmAgentState, SwarmLog, AgentStatus } from './types';

export class SwarmPersistence {
    /**
     * Updates or creates agent state in database
     */
    async upsertAgentState(state: Partial<SwarmAgentState> & { id: string }): Promise<void> {
        await sql`
            INSERT INTO swarm_agents ${sql(state)}
            ON CONFLICT (id) DO UPDATE
            SET ${sql(state)},
                updated_at = NOW()
        `;
    }

    /**
     * Retrieves agent state from database
     */
    async getAgentState(agentId: string): Promise<SwarmAgentState | null> {
        const [state] = await sql<SwarmAgentState[]>`
            SELECT * FROM swarm_agents WHERE id = ${agentId}
        `;
        return state || null;
    }

    /**
     * Gets all active agent states
     */
    async getActiveAgents(): Promise<SwarmAgentState[]> {
        return await sql<SwarmAgentState[]>`
            SELECT * FROM swarm_agents 
            WHERE status IN ('starting', 'running')
            ORDER BY created_at DESC
        `;
    }

    /**
     * Adds a log entry
     */
    async addLog(log: Omit<SwarmLog, 'id' | 'timestamp'>): Promise<void> {
        await sql`
            INSERT INTO swarm_logs ${sql({
                id: randomBytes(16).toString('hex'),
                ...log,
                timestamp: new Date()
            })}
        `;
    }

    /**
     * Gets logs for an agent within a time range
     */
    async getAgentLogs(
        agentId: string,
        from: Date,
        to: Date = new Date()
    ): Promise<SwarmLog[]> {
        return await sql<SwarmLog[]>`
            SELECT * FROM swarm_logs
            WHERE agent_id = ${agentId}
            AND timestamp BETWEEN ${from} AND ${to}
            ORDER BY timestamp DESC
        `;
    }

    /**
     * Updates agent status
     */
    async updateAgentStatus(
        agentId: string,
        status: AgentStatus,
        error?: string
    ): Promise<void> {
        await sql`
            UPDATE swarm_agents
            SET status = ${status},
                last_active = NOW(),
                last_error = ${error},
                updated_at = NOW()
            WHERE id = ${agentId}
        `;
    }
} 