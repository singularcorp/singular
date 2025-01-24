/**
 * Main application entry point
 * Sets up Express server with middleware and routes
 * @module app
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import api from './api';
import { swarmManager } from './swarm';
import { initializeDatabase } from './utils/db-init';

// Initialize Express application
const app = express();

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// API routes
app.use('/api/v1', api);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM. Starting graceful shutdown...');
    await swarmManager.shutdown();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('Received SIGINT. Starting graceful shutdown...');
    await swarmManager.shutdown();
    process.exit(0);
});

// Initialize database before starting server
async function startServer() {
    try {
        await initializeDatabase();
        
        const PORT = process.env.PORT || 3005;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

export default app;