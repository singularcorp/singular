/**
 * Core imports for cryptographic operations and Merkle tree functionality
 */
import { createHash, createPrivateKey, createSign, createVerify } from 'crypto';
import { MerkleTree } from 'merkletreejs';
import { StateMachineLogger } from './logger';
import SHA256 from 'crypto-js/sha256';

/**
 * AgentState defines the possible states an autonomous agent can be in
 * This forms the basis of the state machine's transition graph
 */
export type AgentState = 
  'IDLE' |      // Initial resting state
  'INIT' |      // Initialization state
  'GOAL_PARSE' | // Parsing and understanding goals
  'PLANNING' |   // Strategic planning phase
  'EXECUTING' |  // Executing planned actions
  'VALIDATING' | // Validating results
  'REPORTING' |  // Generating reports
  'COMPLETED' |  // Successfully completed
  'ERROR' |      // Error state
  'TERMINATED';  // Final terminated state

/**
 * Array of all possible agent states for iteration and validation
 */
export const AgentStates: AgentState[] = [
  'IDLE',
  'INIT',
  'GOAL_PARSE',
  'PLANNING',
  'EXECUTING',
  'VALIDATING',
  'REPORTING', 
  'COMPLETED',
  'ERROR',
  'TERMINATED'
];

/**
 * Represents a transition between states
 * Captures the source and destination states along with associated metadata
 */
export interface StateTransition {
  from: AgentState;    // Source state
  to: AgentState;      // Destination state
  action: string;      // Action triggering the transition
  params: any;         // Additional parameters for the transition
}

/**
 * Represents an action that can trigger a state transition
 */
export interface StateTransitionAction {
    action: string;    // Name of the action
    params: any;       // Parameters for the action
}

/**
 * Cryptographic proof of a state transition
 * Implements a Merkle tree-based verification system
 */
export interface Proof {
  stateHash: string;     // Hash of the current state
  prevHash: string;      // Hash of the previous state
  merkleRoot: string;    // Root of the Merkle tree
  merkleProof: string[]; // Proof path in the Merkle tree
  signature: string;     // Cryptographic signature
  timestamp: number;     // Timestamp of proof generation
}

/**
 * Interface for handling state-specific logic
 */
export interface StateHandler {
  entry?: (data?: any) => Promise<StateTransition>;    // Logic executed on entering state
  exit?: (data?: any) => Promise<StateTransition>;     // Logic executed on exiting state
  actions?: Record<string, (data: any) => Promise<StateTransition>>; // State-specific actions
}

/**
 * Defines valid state transitions
 * Key: current state, Value: array of valid next states
 */
const validTransitions: Record<AgentState, AgentState[]> = {
    IDLE: ['INIT', 'ERROR', 'TERMINATED'],
    INIT: ['GOAL_PARSE', 'ERROR', 'TERMINATED', 'IDLE'],
    GOAL_PARSE: ['PLANNING', 'ERROR', 'TERMINATED', 'IDLE'],
    PLANNING: ['PLANNING', 'EXECUTING', 'ERROR', 'TERMINATED', 'IDLE'],
    EXECUTING: ['EXECUTING','VALIDATING', 'REPORTING', 'ERROR', 'TERMINATED', 'IDLE'],
    VALIDATING: ['VALIDATING', 'COMPLETED', 'REPORTING', 'EXECUTING', 'ERROR', 'TERMINATED', 'IDLE'],
    REPORTING: ['VALIDATING','REPORTING','COMPLETED', 'ERROR', 'TERMINATED', 'IDLE'],
    COMPLETED: ['TERMINATED', 'IDLE'],
    ERROR: ['TERMINATED', 'IDLE'],
    TERMINATED: []
};

/**
 * Base class implementing core state machine functionality
 * Handles cryptographic operations and state history tracking
 */
class BaseState {
  protected stateHistory: string[] = [];        // History of state hashes
  protected merkleTree: MerkleTree;            // Merkle tree for verification
  protected id: string;                        // Unique identifier
  protected sessionId: string;                 // Session identifier
  protected privateKey: string;                // Private key for signing

  constructor(id: string, sessionId: string, privateKey: string) {
    this.id = id;
    this.sessionId = sessionId;
    this.privateKey = privateKey;
    this.merkleTree = new MerkleTree([], SHA256);
  }

  /**
   * Creates a deterministic hash of a state transition
   */
  protected hashState(state: StateTransition): string {
    const stateStr = JSON.stringify({
      timestamp: Date.now(),
      from: state.from,
      to: state.to,
      action: state.action,
      params: state.params
    });
    return SHA256(stateStr).toString();
  }

  /**
   * Generates cryptographic proof of a state transition
   * Includes Merkle tree proof and digital signature
   */
  protected generateProof(state: StateTransition): Proof {
    const stateHash = this.hashState(state);
    this.stateHistory.push(stateHash);
    
    const leaves = [...this.stateHistory];
    this.merkleTree = new MerkleTree(leaves,SHA256);

    const merkleRoot = this.merkleTree.getHexRoot();
    const merkleProof = this.merkleTree.getHexProof(stateHash);

    return {
      stateHash,
      prevHash: this.stateHistory[this.stateHistory.length - 2] || '',
      merkleRoot,
      merkleProof,
      signature: this.sign(stateHash),
      timestamp: Date.now()
    };
  }

  /**
   * Signs data using the private key
   */
  private sign(hash: string): string {
    const privateKeyObject = createPrivateKey({
      key: Buffer.from(this.privateKey, 'hex'),
      format: 'der',
      type: 'pkcs8'
    });

    const signer = createSign('SHA256');
    signer.update(hash);
    return signer.sign(privateKeyObject, 'hex');
  }

  /**
   * Verifies a signature using the public key
   */
  public verifySignature(hash: string, signature: string, publicKey: string): boolean {
    const verify = createVerify('SHA256');
    verify.update(hash);
    return verify.verify(publicKey, Buffer.from(signature, 'hex'));
  }

  /**
   * Broadcasts state changes to a network (to be implemented)
   */
  protected async broadcast(data: any): Promise<void> {
    // Implement relay network broadcast
  }
}

/**
 * Represents a node in the state machine graph
 */
export interface StateNode {
    state: AgentState;
    transitions: Map<AgentState, StateTransition>;
  }

/**
 * Main state machine implementation for autonomous agents
 * Manages state transitions and maintains transition history
 */
export class AgentStateMachine extends BaseState {
    private currentState: AgentState = 'INIT';
    private stateNodes: Map<AgentState, StateNode> = new Map();
    private logger: StateMachineLogger;
    
    constructor(id: string, sessionId: string, privateKey: string, logger?: StateMachineLogger) {
      super(id, sessionId, privateKey);
      this.logger = logger || new StateMachineLogger();
      this.initializeStates();
    }
  
    /**
     * Initializes the state machine graph
     * Creates nodes and sets up valid transitions
     */
    private initializeStates(): void {
      // Create nodes for all states
      AgentStates.forEach(state => {
        this.stateNodes.set(state, {
          state,
          transitions: new Map(),
        });
      });
  
      // Wire up transitions based on validTransitions
      Object.entries(validTransitions).forEach(([fromState, toStates]) => {
        const node = this.stateNodes.get(fromState as AgentState);
        if (!node) return;
  
        toStates.forEach(toState => {
          node.transitions.set(toState, {
            from: fromState as AgentState,
            to: toState,
            action: '', // Will be set during actual transition
            params: null
          });
        });
      });

    //   console.log(this.stateNodes)
    }
  
    /**
     * Executes a state transition if valid
     * Generates and logs cryptographic proof of transition
     */
    async transitionTo(state: AgentState, action: string, data?: any): Promise<Proof> {
        const currentNode = this.stateNodes.get(this.currentState);
        const nextNode = this.stateNodes.get(state);
          
        if (!currentNode || !currentNode.transitions.has(state)) {
          throw new Error(`Invalid transition from ${this.currentState} to ${state}`);
        }
    
        let proof = this.generateProof({ 
            from: this.currentState,
            to: state,
            action: action,
            params: data
        });

        this.logger.logTransition(
            this.id,
            this.sessionId,
            this.currentState,
            state,
            action,
            proof
        );

        this.currentState = state;

        return proof;
      }
  
    /**
     * Returns array of valid states that can be transitioned to
     */
    getAvailableTransitions(): AgentState[] {
      const node = this.stateNodes.get(this.currentState);
      return node ? Array.from(node.transitions.keys()) : [];
    }
  
    /**
     * Returns the current state of the machine
     */
    getCurrentState(): AgentState {
      return this.currentState;
    }

    /**
     * Returns formatted logs of state transitions
     */
    getLogs(): string {
        return this.logger.getLogs(this.sessionId);
    }
  }
