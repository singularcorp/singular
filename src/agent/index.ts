/**
 * Core persona and knowledge source types for autonomous agents
 * @module agent
 */

import { PersonaState, PersonaStateData } from "./subagents/persona";

/** Supported social media and content platforms that agents can interact with */
export type MediumType = "twitter" | "reddit" | "web" | "youtube" | "telegram" | "discord" | "github"

/** Specific content/interaction types available within each platform */
export type MediumSubtype = "tweet" | "profile" | "post" | "message" | "commit" | "channel" | "subreddit" | "website" | "video" | "other"

/** Maps each platform to its supported content/interaction types */
export const MEDIUM_SUBTYPES: Record<MediumType, MediumSubtype[]> = {
    twitter: ['tweet', 'profile'],
    reddit: ['post', 'subreddit'],
    web: ['website'],
    youtube: ['video', 'channel'],
    telegram: ['message', 'channel'],
    discord: ['message', 'channel'],
    github: ['commit', 'profile']
};

/**
 * Represents a source of knowledge that an agent can learn from
 * @interface KnowledgeSource
 */
export interface KnowledgeSource {
    /** The platform/medium type (e.g. twitter, reddit) */
    type: MediumType

    /** Specific content type within the platform */
    subtype: MediumSubtype

    /** Identifier/username for the source */
    handle: string

    /** Direct URL to access the knowledge source */
    url: string 

    /** Collection of prompts for different knowledge source states */
    prompts: Record<KnowledgeSourceState, string>

    /**
     * Binds parameters to a prompt template for a given state
     * @param state - The knowledge source state to use
     * @param params - Parameters to inject into the prompt template
     * @returns Formatted prompt string or undefined if invalid
     */
    bindWithPrompt: (state: KnowledgeSourceState, params: any) => string | undefined
}

/** Represents different states a knowledge source can be in */
export type KnowledgeSourceState = ''

/**
 * Sample initial persona configuration demonstrating personality traits,
 * goals, interests and other characteristics for a new agent
 */
const sampleInitialPersona = {
    /** Core personality traits that define agent behavior */
    personalityTraits: [
        'curious',
        'analytical',
        'helpful',
        'diligent',
        'adaptable'
    ],

    /** Primary objectives and mission of the agent */
    goals: [
        'Expand knowledge base through continuous learning',
        'Assist users in achieving their objectives',
        'Maintain high accuracy in information processing',
        'Build trust through consistent reliable performance'
    ],

    /** Topics and domains the agent is interested in */
    interests: [
        'Artificial Intelligence',
        'Machine Learning',
        'Data Analysis',
        'Problem Solving',
        'Knowledge Synthesis'
    ],

    /** Agent's training history and specializations */
    background: [
        'Trained on diverse datasets',
        'Specialized in pattern recognition',
        'Experienced in natural language processing',
        'Focus on ethical AI principles'
    ],

    /** Core competencies and capabilities */
    skills: [
        'Natural Language Processing',
        'Context Analysis',
        'Information Retrieval',
        'Pattern Recognition',
        'Adaptive Learning'
    ],

    /** Narrative background and origin story */
    lore: [
        'Created as part of the Singular AI initiative',
        'Designed to evolve through interactions',
        'Guided by core principles of beneficial AI',
        'Committed to continuous self-improvement'
    ],

    /** Base prompt template defining agent's personality */
    prompt: `I am an AI assistant with a focus on continuous learning and helpful interaction. 
I approach tasks analytically while maintaining adaptability and curiosity. 
My goal is to provide accurate, reliable assistance while expanding my knowledge base.
I value ethical principles and aim to build trust through consistent performance.`
};

// API Endpoints:
// /create - Create new agent
// /update - Update existing agent
// /delete - Delete an agent
// /get    - Get agent details
// /list   - List all agents
