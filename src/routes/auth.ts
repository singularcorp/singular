/**
 * Authentication routes module
 * Handles wallet connection and token refresh endpoints
 * @module routes/auth
 */

import { Router } from 'express';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { randomBytes } from 'crypto';
import { User, createUser, getUserByWallet } from '../user/user';
import { createTokenPair, refreshAccessToken } from '../auth/token';
import { authenticatedMust, AuthenticatedRequest } from '../auth/middleware';

const router = Router();


// console.log("NACL:",  nacl.sign)
            // console.log("NACL.sign:",  nacl.sign)
            // console.log("NACL.sign.detached:",  nacl.sign.detached)
            // console.log("NACL.sign.detached.verify:",  nacl.sign.detached.verify)
/**
 * GET /auth/wallet/connect/init
 * Initializes wallet connection by providing a message to sign
 * Called before wallet signature to get the message that needs to be signed
 */
router.get('/wallet/connect/init', async (req, res) => {
    try {
        // Generate random message for wallet to sign
        const message = `Sign this message to connect your wallet: ${randomBytes(32).toString('hex')}`;
        
        res.json({
            message,
            nonce: `${Math.floor(Date.now() / 1000)}`
        });
    } catch (error) {
        console.error('Error initializing wallet connection:', error);
        res.status(500).json({ 
            error: 'Failed to initialize wallet connection',
            details: error.message
        });
    }
});


/**
 * POST /auth/wallet/connect
 * Authenticates user via Solana wallet signature
 * Called when user connects their wallet from browser
 */
router.post('/wallet/connect', async (req, res) => {
    try {
        // 1. Validate request data
        const { publicKey, signature, message } = req.body;

        console.log('req.body', req.body);
        console.log('message', message);
        console.log('signature', signature);
        console.log('publicKey', publicKey);
        // const { publicKey } = req.body;

        if (!publicKey || !signature || !message) {
            return res.status(400).json({ 
                error: 'Missing required fields: publicKey, signature, and message are required' 
            });
        }

        // 1. Verify the signature from Solana wallet
        try {
            // console.log("NACL:",  nacl)
            // console.log("NACL.sign:",  nacl.sign)
            // console.log("NACL.sign.detached:",  nacl.sign.detached)
            // console.log("NACL.sign.detached.verify:",  nacl.sign.detached.verify)
            const verified = nacl.sign.detached.verify(
                Buffer.from(message),
                Buffer.from(signature, 'base64'),
                new PublicKey(publicKey).toBytes()
            );

            if (!verified) {
                return res.status(401).json({ 
                    error: 'Invalid wallet signature',
                    code: 'INVALID_SIGNATURE'
                });
            }
        } catch (error) {
            console.error('Signature verification error:', error);
            return res.status(401).json({ 
                error: 'Failed to verify wallet signature',
                code: 'SIGNATURE_VERIFICATION_FAILED'
            });
        }

        // 2. Get or create user based on wallet address
        let user: User;
        try {
            // Check if user exists
            user = await getUserByWallet(publicKey);
            
            if (!user) {
                // 2a. Create new user if wallet not found
                const username = `user_${randomBytes(4).toString('hex')}`;
                user = await createUser({
                    id: randomBytes(16).toString('hex'),
                    walletAddress: publicKey,
                    username,
                    role: 'user',
                    bio: '',
                    avatarUrl: '',
                    fullName: '',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                console.log('Created new user:', username);
            }
            // 2b. Existing user found, continue with their data
        } catch (error) {
            console.error('User lookup/creation error:', error);
            return res.status(500).json({ 
                error: 'Failed to process user account',
                code: 'USER_PROCESSING_FAILED'
            });
        }

        // 3. Generate new token pair
        let tokens;
        try {
            tokens = await createTokenPair(user.id, user.walletAddress);
        } catch (error) {
            console.error('Token generation error:', error);
            return res.status(500).json({ 
                error: 'Failed to generate authentication tokens',
                code: 'TOKEN_GENERATION_FAILED'
            });
        }

        // Set CSRF token cookie
        res.cookie('csrf-token', tokens.csrfToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        console.log('FOUND USER: ', user.id);
        // 4. Return tokens and user data
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
            },
            tokens: {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            }
        });

    } catch (error) {
        console.error('Wallet connection error:', error);
        res.status(500).json({ 
            error: 'Failed to connect wallet',
            code: 'CONNECTION_FAILED'
        });
    }
});

/**
 * POST /auth/refresh
 * Refreshes access token using refresh token
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const csrfToken = req.headers['x-csrf-token'] as string;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }

        if (!csrfToken) {
            return res.status(400).json({ error: 'CSRF token is required' });
        }

        // Get new token pair
        const tokens = await refreshAccessToken(refreshToken, csrfToken);

        // Set new CSRF token cookie
        res.cookie('csrf-token', tokens.csrfToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            tokens: {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            }
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({ error: 'Failed to refresh token' });
    }
});

/**
 * POST /auth/logout
 * Logs out the user by invalidating their tokens
 */
router.post('/logout', authenticatedMust, async (req: AuthenticatedRequest, res) => {
    try {
        const { userId } = req.user!;
        
        // Clear CSRF cookie
        res.clearCookie('csrf-token');

        // TODO: Add token to blacklist or invalidate in database
        // This would prevent the token from being used even if it hasn't expired
        
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Failed to logout' });
    }
});

/**
 * GET /auth/verify
 * Verifies the current authentication status
 */
router.get('/verify', authenticatedMust, async (req: AuthenticatedRequest, res) => {
    try {
        const { userId, walletAddress } = req.user!;
        const user = await getUserByWallet(walletAddress);
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        res.json({
            authenticated: true,
            user: {
                id: user.id,
                username: user.username,
                walletAddress: user.walletAddress,
                role: user.role,
                bio: user.bio,
                avatarUrl: user.avatarUrl,
                fullName: user.fullName,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        console.error('Auth verification error:', error);
        res.status(500).json({ error: 'Failed to verify authentication' });
    }
});

export default router; 