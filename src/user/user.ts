/**
 * User management module for handling wallet-based user accounts
 * Provides user data structures and database operations
 * @module user
 */

import sql from '../utils/sql';

/**
 * Represents a user in the system
 * 
 * A User is identified by their wallet address and can create/manage AI agents.
 * Authentication is handled through wallet signatures rather than email/password.
 */
export interface User {
    /** Unique identifier for the user */
    id: string;

    /** User's display name */
    username: string;

    /** Optional full name */
    fullName?: string;

    /** Brief user bio/description */
    bio?: string;

    /** URL to user's avatar image */
    avatarUrl?: string;

    /** Ethereum wallet address used for authentication */
    walletAddress: string;

    /** User's role (currently only 'user' supported) */
    role: 'user';

    /** Timestamp when the user was created */
    createdAt: Date;

    /** Timestamp of last profile update */
    updatedAt: Date;
}

/**
 * Creates a new user in the database
 * @param user - User data to create
 * @returns Created user record
 */
export async function createUser(user: User): Promise<User> {
    const result = await sql<User[]>`
        INSERT INTO users (
            id,
            username,
            full_name,
            bio,
            avatar_url,
            wallet_address,
            role,
            created_at,
            updated_at
        ) VALUES (
            ${user.id},
            ${user.username},
            ${user.fullName},
            ${user.bio},
            ${user.avatarUrl},
            ${user.walletAddress},
            ${user.role},
            ${user.createdAt},
            ${user.updatedAt}
        ) RETURNING *
    `;
    
    return result[0];
}

/**
 * Retrieves a user by ID
 * @param id - User identifier
 * @returns User record if found
 */
export async function getUser(id: string): Promise<User | null> {
    const results = await sql<User[]>`
        SELECT * FROM users WHERE id = ${id}
    `;
    return results[0] || null;
}

/**
 * Retrieves a user by wallet address
 * @param walletAddress - Ethereum wallet address
 * @returns User record if found
 */
export async function getUserByWallet(walletAddress: string): Promise<User | null> {
    const results = await sql<User[]>`
        SELECT * FROM users WHERE wallet_address = ${walletAddress}
    `;
    return results[0] || null;
}

/**
 * Updates an existing user's profile
 * @param id - User identifier
 * @param updates - Partial user data to update
 * @returns Updated user record
 */
export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
    const sets = [];
    
    // Build dynamic SET clause
    for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
            sets.push(`${key} = ${value}`);
        }
    }

    // Add updated_at timestamp
    sets.push(`updated_at = NOW()`);

    const result = await sql<User[]>`
        UPDATE users 
        SET ${sql(sets.join(', '))}
        WHERE id = ${id}
        RETURNING *
    `;
    
    return result[0];
}

/**
 * Deletes a user from the database
 * @param id - User identifier to delete
 * @returns Boolean indicating success
 */
export async function deleteUser(id: string): Promise<boolean> {
    const result = await sql`
        DELETE FROM users WHERE id = ${id}
    `;
    return result.count > 0;
}

/**
 * Lists all users, optionally filtered by criteria
 * @param filter - Optional filter criteria
 * @returns Array of matching users
 */
export async function listUsers(filter?: Partial<User>): Promise<User[]> {
    if (!filter) {
        return await sql`SELECT * FROM users ORDER BY created_at DESC`;
    }

    const conditions = [];

    // Build dynamic WHERE clause
    for (const [key, value] of Object.entries(filter)) {
        if (value !== undefined) {
            conditions.push(`${key} = ${value}`);
        }
    }

    return await sql<User[]>`
        SELECT * FROM users 
        WHERE ${sql(conditions.join(' AND '))}
        ORDER BY created_at DESC
    `;
} 