/**
 * Agent management routes module
 * Handles CRUD operations for AI agents
 * @module routes/agents
 */

import { Router } from 'express';
import { authenticatedMust, AuthenticatedRequest } from '../auth/middleware';
import { createAgentForUser, getAgentsByUser, getAgentById } from '../agent/model';
import { PersonaSubAgent } from '../agent/subagents/persona';
import { defaultPrivateKeyHex } from '../config/defaults';
import { swarmManager } from '../swarm';

const router = Router();

// Get all agents for the authenticated user
router.get('/', authenticatedMust, async (req: AuthenticatedRequest, res) => {
    try {
        const { userId } = req.user!;
        const agents = await getAgentsByUser(userId);
        
        // Include swarm status for each agent
        const agentsWithStatus = agents.map(agent => ({
            id: agent.id,
            name: agent.name,
            status: agent.status,
            createdAt: agent.createdAt,
            activeInSwarm: swarmManager.isAgentActive(agent.id)
        }));
        
        res.json({ agents: agentsWithStatus });
    } catch (error) {
        console.error('Error getting agents:', error);
        res.status(500).json({ error: 'Failed to get agents' });
    }
});

// Get specific agent by ID
router.get('/:id', authenticatedMust, async (req: AuthenticatedRequest, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.user!;
        
        const agent = await getAgentById(id, userId);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        // Include swarm status
        const agentWithStatus = {
            ...agent,
            activeInSwarm: swarmManager.isAgentActive(agent.id)
        };

        res.json({ agent: agentWithStatus });
    } catch (error) {
        console.error('Error getting agent:', error);
        res.status(500).json({ error: 'Failed to get agent' });
    }
});

// Chat with specific agent
router.post('/:id/chat', authenticatedMust, async (req: AuthenticatedRequest, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        const { userId } = req.user!;
        
        if (!message) {
            return res.status(400).json({
                error: 'Message is required'
            });
        }

        const agent = await getAgentById(id, userId);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        // Ensure agent is running in swarm
        if (!swarmManager.isAgentActive(agent.id)) {
            await swarmManager.startAgent(agent);
        }

        // Send message through swarm manager
        const response = await swarmManager.sendMessage(agent.id, {
            type: 'chat',
            content: message
        });

        if (!response.success) {
            throw new Error(response.error || 'Failed to process message');
        }

        res.json({ response: response.response });
    } catch (error) {
        console.error('Error chatting with agent:', error);
        res.status(500).json({ error: 'Failed to chat with agent' });
    }
});

// Create new agent
router.post('/new', authenticatedMust, async (req: AuthenticatedRequest, res) => {
    try {
        const { name, bio, profileImageURL, persona, execution, learningConfig } = req.body;
        const { userId } = req.user!;

        if (!persona) {
            return res.status(400).json({
                error: 'Persona configuration is required'
            });
        }

        if (!name) {
            return res.status(400).json({
                error: 'Agent name is required'
            });
        }

        const agent = await createAgentForUser(
            userId,
            name,
            bio,
            profileImageURL,
            persona,
            execution,
            learningConfig
        );

        // Optionally start the agent in the swarm
        const autoStart = req.query.autoStart === 'true';
        if (autoStart) {
            await swarmManager.startAgent(agent);
        }

        res.json({ 
            message: 'Agent created successfully',
            agent: {
                id: agent.id,
                name: agent.name,
                status: agent.status,
                createdAt: agent.createdAt,
                activeInSwarm: autoStart
            }
        });
    } catch (error) {
        console.error('Error creating agent:', error);
        res.status(500).json({ error: 'Failed to create agent' });
    }
});

export default router; 