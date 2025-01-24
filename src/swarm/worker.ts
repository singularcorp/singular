/**
 * Worker thread implementation for running agents
 */

import { parentPort, workerData } from 'worker_threads';
import { PersonaSubAgent } from '../agent/subagents/persona';

interface WorkerMessage {
    type: 'chat' | 'command' | 'system';
    content: string;
    messageId: string;
    metadata?: Record<string, any>;
}

async function runAgent() {
    const { agentId, name, privateKeyHex, persona } = workerData;
    
    try {
        // Initialize agent
        const agent = new PersonaSubAgent(agentId, name, privateKeyHex);
        await agent.init(persona);

        // Handle messages from main thread
        parentPort?.on('message', async (message: WorkerMessage) => {
            try {
                let response: string;
                
                switch (message.type) {
                    case 'chat':
                        response = await agent.processMessage(message.content);
                        break;
                    case 'system':
                        // Handle system commands
                        response = 'System command processed';
                        break;
                    default:
                        throw new Error('Unknown message type');
                }

                parentPort?.postMessage({
                    messageId: message.messageId,
                    success: true,
                    response
                });
            } catch (error) {
                parentPort?.postMessage({
                    messageId: message.messageId,
                    success: false,
                    error: error.message
                });
            }
        });

        // Signal that agent is ready
        parentPort?.postMessage({ type: 'ready', agentId });

    } catch (error) {
        parentPort?.postMessage({ type: 'error', error: error.message });
        process.exit(1);
    }
}

runAgent(); 