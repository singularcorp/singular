/**
 * Message queue implementation for agent communication
 * Uses a pub/sub pattern for thread-safe message passing
 */

import { EventEmitter } from 'events';

export interface AgentMessage {
    type: 'chat' | 'command' | 'system';
    content: string;
    metadata?: Record<string, any>;
}

export interface MessageResponse {
    success: boolean;
    response?: string;
    error?: string;
}

export class AgentMailbox {
    private emitter: EventEmitter;
    private messageQueue: Map<string, AgentMessage[]>;
    private responseCallbacks: Map<string, (response: MessageResponse) => void>;

    constructor() {
        this.emitter = new EventEmitter();
        this.messageQueue = new Map();
        this.responseCallbacks = new Map();
    }

    /**
     * Registers an agent to receive messages
     * @param agentId Unique agent identifier
     */
    registerAgent(agentId: string): void {
        if (!this.messageQueue.has(agentId)) {
            this.messageQueue.set(agentId, []);
        }
    }

    /**
     * Sends a message to a specific agent
     * @returns Promise that resolves with agent's response
     */
    async sendMessage(agentId: string, message: AgentMessage): Promise<MessageResponse> {
        return new Promise((resolve) => {
            const messageId = `${agentId}_${Date.now()}_${Math.random()}`;
            this.responseCallbacks.set(messageId, resolve);
            this.emitter.emit(`message:${agentId}`, { ...message, messageId });
        });
    }

    /**
     * Listens for messages sent to an agent
     * @param agentId Agent identifier
     * @param callback Function to handle received messages
     */
    onMessage(agentId: string, callback: (message: AgentMessage & { messageId: string }) => void): void {
        this.emitter.on(`message:${agentId}`, callback);
    }

    /**
     * Sends a response back to the message sender
     */
    sendResponse(messageId: string, response: MessageResponse): void {
        const callback = this.responseCallbacks.get(messageId);
        if (callback) {
            callback(response);
            this.responseCallbacks.delete(messageId);
        }
    }

    /**
     * Removes an agent from the message system
     */
    unregisterAgent(agentId: string): void {
        this.messageQueue.delete(agentId);
        this.emitter.removeAllListeners(`message:${agentId}`);
    }
} 