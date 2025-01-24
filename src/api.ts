/**
 * Main API router module
 * Combines all route modules into a single router
 * @module api
 */

import { Router } from 'express';
import authRoutes from './routes/auth';
import agentRoutes from './routes/agents';
import userRoutes from './routes/users';
import swarmRoutes from './routes/swarm';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/agents', agentRoutes);
router.use('/user', userRoutes);
router.use('/swarm', swarmRoutes);


export default router;
