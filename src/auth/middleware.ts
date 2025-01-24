/**
 * Authentication middleware for protecting API endpoints
 * @module auth/middleware
 */

import { Request, Response, NextFunction } from 'express';
import { verifyTokens } from './token';

/**
 * Extended Express Request interface with authenticated user data
 */
export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        walletAddress: string;
    };
}

/**
 * Middleware to enforce authentication on protected routes
 * Verifies JWT token and CSRF token
 */
export async function authenticatedMust(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const authHeader = req.headers.authorization;
        const csrfToken = req.headers['x-csrf-token'] as string;

        if (!authHeader) {
            return res.status(401).json({ error: 'No authorization header' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        if (!csrfToken) {
            return res.status(401).json({ error: 'No CSRF token provided' });
        }

        // Verify both tokens
        const userData = await verifyTokens(token, csrfToken);
        
        // Attach user data to request
        req.user = userData;
        
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
} 