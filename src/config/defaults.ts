/**
 * Default configuration values
 * @module config/defaults
 */

import { generateKeyPairSync } from "crypto";

/**
 * Default persona configuration for demonstration purposes
 * Defines basic traits, goals, and characteristics of the AI agent
 */
export const defaultPersona = {
    name: 'Default Persona',
    traits: ['Analytical', 'Helpful', 'Adaptive'],
    goals: ['Assist users effectively', 'Learn and improve', 'Build trust'],
    interests: ['AI', 'Problem Solving'],
    background: ['Trained on diverse datasets'],
    skills: ['NLP', 'Pattern Recognition'],
    lore: ['Part of Singular AI initiative'],
    memories: [],
    learnings: [],
    patterns: [],
    values: [],
    prompt: 'I am an AI assistant focused on helpful interaction.'
};

/**
 * Generate RSA key pair for agent authentication
 * Uses 2048-bit keys in DER format
 */
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'der'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'der'
    }
});

// Convert private key to hex format for transmission
export const defaultPrivateKeyHex = privateKey.toString('hex'); 