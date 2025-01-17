import express from 'express';
import { startSwarm } from './swarm';

const app = express();
app.use(express.json());

// Start swarm endpoint
app.post('/start', async (req, res) => {
    try {
        const { privateKeyHex, initialPersona, numAgents, agentPrefix } = req.body;
        
        if (!privateKeyHex || !initialPersona) {
            return res.status(400).json({ 
                error: 'Missing required parameters: privateKeyHex and initialPersona are required'
            });
        }

        await startSwarm(
            privateKeyHex,
            initialPersona,
            numAgents,
            agentPrefix
        );

        res.json({ message: 'Swarm started successfully' });
    } catch (error) {
        console.error('Error starting swarm:', error);
        res.status(500).json({ error: 'Failed to start swarm' });
    }
});

// Stop swarm endpoint
app.post('/end', async (_req, res) => {
    try {
        // Since there's no explicit stop function shown in the swarm code,
        // we'll just return a success message. You may want to implement
        // actual swarm termination logic.
        res.json({ message: 'Swarm stop request received' });
    } catch (error) {
        console.error('Error stopping swarm:', error);
        res.status(500).json({ error: 'Failed to stop swarm' });
    }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


const defaultPersona = {
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

// Generate a random private key for testing
import { generateKeyPairSync, randomUUID } from "crypto";

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

// Convert to hex strings
const privateKeyHex = privateKey.toString('hex');

startSwarm(privateKeyHex, defaultPersona, 1, "PERSONA_SUBAGENT_DEMO")
    .then(() => console.log('Swarm started successfully'))
    .catch(err => {
        console.error('Failed to start swarm:', err);
        process.exit(1);
    });