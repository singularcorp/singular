/**
 * PostgreSQL database connection utility
 * Provides a configured postgres client instance for database operations
 * @module utils/sql
 */

import postgres from 'postgres'
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * PostgreSQL connection string from environment variables
 * Falls back to empty string if not configured
 */
const connectionString = process.env.POSTGRES_URL ?? ""

/**
 * Configured postgres client instance
 * Set up with camelCase transform for consistent property naming
 */
const sql = postgres(connectionString, { transform: postgres.camel })

export default sql

