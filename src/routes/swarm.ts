/**
 * Swarm management routes module
 * Handles swarm-wide operations and monitoring
 * @module routes/swarm
 */

import { Router } from 'express';
import { authenticatedMust, AuthenticatedRequest } from '../auth/middleware';
import { swarmManager } from '../swarm';
import { getAgentsByUser, getAgentById } from '../agent/model';

const router = Router();

/**
 * GET /swarm/status
 * Returns status of all agents in the swarm for the authenticated user
 */
router.get('/status', authenticatedMust, async (req: AuthenticatedRequest, res) => {
    try {
        const { userId } = req.user!;
        
        // Get all user's agents
        const agents = await getAgentsByUser(userId);
        
        // Get status for each agent
        const agentStatuses = await Promise.all(
            agents.map(async (agent) => {
                const isActive = swarmManager.isAgentActive(agent.id);
                return {
                    id: agent.id,
                    name: agent.name,
                    status: isActive ? 'running' : 'stopped',
                    activeInSwarm: isActive
                };
            })
        );

        res.json({ agents: agentStatuses });
    } catch (error) {
        console.error('Error getting swarm status:', error);
        res.status(500).json({ error: 'Failed to get swarm status' });
    }
});

/**
 * POST /swarm/start
 * Starts all stopped agents for the user
 */
router.post('/start', authenticatedMust, async (req: AuthenticatedRequest, res) => {
    try {
        const { userId } = req.user!;
        const agents = await getAgentsByUser(userId);
        
        const startPromises = agents.map(async (agent) => {
            if (!swarmManager.isAgentActive(agent.id)) {
                await swarmManager.startAgent(agent);
                return agent.id;
            }
        });

        const startedAgents = (await Promise.all(startPromises)).filter(Boolean);
        
        res.json({ 
            message: 'Swarm started successfully',
            startedAgents 
        });
    } catch (error) {
        console.error('Error starting swarm:', error);
        res.status(500).json({ error: 'Failed to start swarm' });
    }
});

/**
 * POST /swarm/stop
 * Stops all running agents for the user
 */
router.post('/stop', authenticatedMust, async (req: AuthenticatedRequest, res) => {
    try {
        const { userId } = req.user!;
        const agents = await getAgentsByUser(userId);
        
        const stopPromises = agents.map(async (agent) => {
            if (swarmManager.isAgentActive(agent.id)) {
                await swarmManager.stopAgent(agent.id);
                return agent.id;
            }
        });

        const stoppedAgents = (await Promise.all(stopPromises)).filter(Boolean);
        
        res.json({ 
            message: 'Swarm stopped successfully',
            stoppedAgents 
        });
    } catch (error) {
        console.error('Error stopping swarm:', error);
        res.status(500).json({ error: 'Failed to stop swarm' });
    }
});

/**
 * POST /swarm/start/:agentId
 * Starts a specific agent in the swarm
 */
router.post('/start/:agentId', authenticatedMust, async (req: AuthenticatedRequest, res) => {
    try {
        const { agentId } = req.params;
        const { userId } = req.user!;

        // Verify agent exists and belongs to user
        const agent = await getAgentById(agentId, userId);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        // Check if already running
        if (swarmManager.isAgentActive(agentId)) {
            return res.status(400).json({ 
                error: 'Agent is already running',
                agentId,
                status: 'running'
            });
        }

        // Start the agent
        await swarmManager.startAgent(agent);

        res.json({ 
            message: 'Agent started successfully',
            agentId,
            status: 'running'
        });
    } catch (error) {
        console.error(`Error starting agent ${req.params.agentId}:`, error);
        res.status(500).json({ 
            error: 'Failed to start agent',
            details: error.message 
        });
    }
});

/**
 * POST /swarm/stop/:agentId
 * Stops a specific agent in the swarm
 */
router.post('/stop/:agentId', authenticatedMust, async (req: AuthenticatedRequest, res) => {
    try {
        const { agentId } = req.params;
        const { userId } = req.user!;

        // Verify agent exists and belongs to user
        const agent = await getAgentById(agentId, userId);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        // Check if already stopped
        if (!swarmManager.isAgentActive(agentId)) {
            return res.status(400).json({ 
                error: 'Agent is already stopped',
                agentId,
                status: 'stopped'
            });
        }

        // Stop the agent
        await swarmManager.stopAgent(agentId);

        res.json({ 
            message: 'Agent stopped successfully',
            agentId,
            status: 'stopped'
        });
    } catch (error) {
        console.error(`Error stopping agent ${req.params.agentId}:`, error);
        res.status(500).json({ 
            error: 'Failed to stop agent',
            details: error.message 
        });
    }
});

export default router; 