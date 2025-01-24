/**
 * Authentication token management module
 * Handles JWT token generation, verification and refresh logic
 * @module auth/token
 */

import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';
import sql from '../utils/sql';

/**
 * Token pair containing access and refresh tokens plus CSRF token
 */
interface TokenPair {
    /** Short-lived access token for API authentication */
    accessToken: string;
    /** Long-lived refresh token for obtaining new access tokens */
    refreshToken: string;
    /** CSRF token for form submission protection */
    csrfToken: string;
}

/**
 * Stored refresh token record
 */
interface RefreshToken {
    /** Unique identifier for the token */
    id: string;
    /** Associated user ID */
    userId: string;
    /** Hashed refresh token */
    tokenHash: string;
    /** CSRF token hash */
    csrfHash: string;
    /** Token expiration timestamp */
    expiresAt: Date;
    /** When the token was created */
    createdAt: Date;
}

// Load environment variables
const {
    JWT_ACCESS_SECRET = randomBytes(32).toString('hex'),
    JWT_REFRESH_SECRET = randomBytes(32).toString('hex'),
    JWT_ACCESS_EXPIRES = '15m',
    JWT_REFRESH_EXPIRES = '604800000', // 7 days in milliseconds
    CSRF_SECRET = randomBytes(32).toString('hex')
} = process.env;

/**
 * Generates a CSRF token and its double-submit cookie hash
 * @returns CSRF token and hash pair
 */
function generateCsrfPair(): { token: string; hash: string } {
    const token = randomBytes(32).toString('hex');
    const hash = createHash('sha256')
        .update(token + CSRF_SECRET)
        .digest('hex');
    
    return { token, hash };
}

/**
 * Validates a CSRF token against its hash
 * @param token - CSRF token from request header
 * @param hash - CSRF hash from database
 * @returns boolean indicating if token is valid
 */
export function validateCsrfToken(token: string, hash: string): boolean {
    const computedHash = createHash('sha256')
        .update(token + CSRF_SECRET)
        .digest('hex');
    return computedHash === hash;
}

/**
 * Creates a new token pair for a user
 * @param userId - User identifier
 * @param walletAddress - User's wallet address
 * @returns Access and refresh token pair with CSRF token
 */
export async function createTokenPair(userId: string, walletAddress: string): Promise<TokenPair> {
    // Generate access token
    const accessToken = jwt.sign(
        { 
            userId,
            walletAddress,
            type: 'access'
        },
        JWT_ACCESS_SECRET,
        { expiresIn: parseInt(JWT_ACCESS_EXPIRES) }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
        { 
            userId,
            walletAddress,
            type: 'refresh'
        },
        JWT_REFRESH_SECRET,
        { expiresIn: parseInt(JWT_REFRESH_EXPIRES) }
    );

    // Generate CSRF token
    const { token: csrfToken, hash: csrfHash } = generateCsrfPair();

    // Store refresh token and CSRF hash in database
    await storeRefreshToken(userId, refreshToken, csrfHash);

    return {
        accessToken,
        refreshToken,
        csrfToken
    };
}

/**
 * Stores a refresh token in the database
 * @param userId - Associated user ID
 * @param token - Refresh token to store
 * @param csrfHash - CSRF token hash
 */
async function storeRefreshToken(userId: string, token: string, csrfHash: string): Promise<void> {
    const tokenHash = jwt.sign({ token }, JWT_REFRESH_SECRET);
    const expiresAt = new Date(Date.now() + parseInt(JWT_REFRESH_EXPIRES));

    await sql`
        INSERT INTO refresh_tokens (
            id,
            user_id,
            token_hash,
            csrf_hash,
            expires_at,
            created_at
        ) VALUES (
            ${randomBytes(16).toString('hex')},
            ${userId},
            ${tokenHash},
            ${csrfHash},
            ${expiresAt},
            NOW()
        )
    `;
}

/**
 * Verifies a refresh token and generates a new access token
 * @param refreshToken - Refresh token to verify
 * @param csrfToken - CSRF token from request header
 * @returns New token pair if refresh token is valid
 * @throws Error if tokens are invalid or expired
 */
export async function refreshAccessToken(
    refreshToken: string,
    csrfToken: string
): Promise<TokenPair> {
    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
            userId: string;
            walletAddress: string;
            type: string;
        };

        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }

        // Check if refresh token exists and validate CSRF
        const tokenHash = jwt.sign({ token: refreshToken }, JWT_REFRESH_SECRET);
        const storedToken = await sql<RefreshToken[]>`
            SELECT * FROM refresh_tokens 
            WHERE token_hash = ${tokenHash}
            AND expires_at > NOW()
            AND user_id = ${decoded.userId}
        `;

        if (!storedToken.length) {
            throw new Error('Invalid refresh token');
        }

        // Validate CSRF token
        if (!validateCsrfToken(csrfToken, storedToken[0].csrfHash)) {
            throw new Error('Invalid CSRF token');
        }

        // Delete old refresh token
        await sql`
            DELETE FROM refresh_tokens 
            WHERE token_hash = ${tokenHash}
        `;

        // Generate new token pair
        return await createTokenPair(decoded.userId, decoded.walletAddress);

    } catch (error) {
        throw new Error('Invalid refresh token');
    }
}

/**
 * Invalidates all refresh tokens for a user
 * @param userId - User identifier
 */
export async function invalidateAllTokens(userId: string): Promise<void> {
    await sql`
        DELETE FROM refresh_tokens 
        WHERE user_id = ${userId}
    `;
}

/**
 * Verifies an access token and CSRF token combination
 * @param accessToken - Access token to verify
 * @param csrfToken - CSRF token from request header
 * @returns Decoded token payload if valid
 * @throws Error if tokens are invalid or expired
 */
export async function verifyTokens(
    accessToken: string,
    csrfToken: string
): Promise<{ userId: string; walletAddress: string }> {
    try {
        const decoded = jwt.verify(accessToken, JWT_ACCESS_SECRET) as {
            userId: string;
            walletAddress: string;
            type: string;
        };

        if (decoded.type !== 'access') {
            throw new Error('Invalid token type');
        }

        // Get stored CSRF hash
        const storedToken = await sql<RefreshToken[]>`
            SELECT csrf_hash FROM refresh_tokens 
            WHERE user_id = ${decoded.userId}
            AND expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 1
        `;

        if (!storedToken.length || !validateCsrfToken(csrfToken, storedToken[0].csrfHash)) {
            throw new Error('Invalid CSRF token');
        }

        return {
            userId: decoded.userId,
            walletAddress: decoded.walletAddress
        };
    } catch (error) {
        throw new Error('Invalid access token');
    }
} 