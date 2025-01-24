/**
 * User management routes module
 * Handles user profile operations
 * @module routes/users
 */

import { Router } from 'express';
import { authenticatedMust, AuthenticatedRequest } from '../auth/middleware';
import { getUser } from '../user/user';

const router = Router();

router.get('/profile', authenticatedMust, async (req: AuthenticatedRequest, res) => {
    try {
        const { userId } = req.user!;
        
        const user = await getUser(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return sanitized user data (excluding sensitive fields)
        res.json({
            user: {
                id: user.id,
                username: user.username,
                walletAddress: user.walletAddress,
                bio: user.bio,
                avatarUrl: user.avatarUrl,
                fullName: user.fullName,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({ error: 'Failed to get user profile' });
    }
});

export default router; 