import { KnowledgeSource } from "."
import { PersonaState, PersonaStateData } from "./persona"

/**
 * Represents an autonomous agent in the system
 * 
 * An Agent is an AI-powered entity that can interact with users, learn from experiences,
 * and execute tasks based on its configuration. Each agent has a unique identity,
 * personality traits, and learning capabilities.
 */
export interface Agent {
    /** Unique identifier for the agent */
    id: string

    /** Display name of the agent */
    name: string

    /** Brief description of the agent's purpose and characteristics */
    bio: string

    /** URL to the agent's profile/avatar image */
    profileImageURL: string

    /** Ethereum wallet address paired with this agent for transactions */
    pairedWalletAddress: string

    /** Smart contract address associated with this agent */
    contractAddress: string

    /** Initial personality state and traits of the agent */
    initialPersona: PersonaStateData

    /** 
     * Configuration for agent's task execution behavior
     */
    execution: {
        /** How often the agent performs actions (in milliseconds) */
        frequency: number
        /** Initial computational resources allocated to the agent */
        initialResourceAllocation: number
        /** Base prompt/instructions for task execution */
        prompt: string
    }

    /**
     * Configuration for agent's learning and adaptation capabilities
     */
    learningConfig: {
        /** Rate at which agent incorporates new information (0-1) */
        learningRate: number
        /** Maximum amount of historical information agent can retain */
        memoryCapacity: number
        /** Initial propensity to explore new information (0-1) */
        initialCuriosityRate: number
        /** Base prompt/instructions for learning behavior */
        prompt: string
    }

    // /** Sources of knowledge the agent can access and learn from */
    // knowledgeSources: KnowledgeSource[]

    /** 
     * Social media presence and connection points
     * Array of platform links where users can interact with the agent
     */
    socialLinks: {
        /** Supported social media platform */
        platform: "twitter" | "github" | "telegram" | "discord" | "other"
        /** URL to agent's profile on the platform */
        url: string
    }[]

    /** Timestamp when the agent was created */
    createdAt: Date

    /** Timestamp of last update to agent configuration */
    updatedAt: Date
}
