/**
 * PostgreSQL job queue manager using pg-boss
 * Handles background job processing and scheduling for the application
 * @module utils/boss
 */

import PgBoss from "pg-boss";

/**
 * Global pg-boss instance for managing job queues
 * Initialized with PostgreSQL connection URL from environment variables
 */
export const boss = new PgBoss(process.env.POSTGRES_URL);

// Start the job queue manager
await boss.start();