export type AgentStatus = 'starting' | 'running' | 'stopping' | 'stopped' | 'error';

export interface SwarmAgentState {
    id: string;
    userId: string;
    status: AgentStatus;
    lastActive: Date;
    lastError?: string;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

export interface SwarmLog {
    id: string;
    agentId: string;
    type: 'info' | 'error' | 'warning' | 'debug';
    message: string;
    metadata?: Record<string, any>;
    timestamp: Date;
} 