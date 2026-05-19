/**
 * @module embed
 * Ollama bge-large embedding client with AbortController timeout and configurable fleet routing.
 * Configure via OLLAMA_NODES env var (comma-separated) or OLLAMA_URL for single-node setups.
 */
import { config } from '../config.js';

const EMBED_TIMEOUT_MS = 15_000;
let currentNodeIndex = 0;

function getNextNode() {
    const nodes = config.ollama.nodes;
    const node = nodes[currentNodeIndex];
    currentNodeIndex = (currentNodeIndex + 1) % nodes.length;
    return node;
}

/**
 * Generate an embedding vector for the given text via Ollama.
 * Uses round-robin routing across configured nodes and falls back
 * to a zero vector on timeout or network failure across all nodes.
 * @param {string} text - The text to embed.
 * @returns {Promise<number[]>} The embedding vector.
 */
export async function getEmbedding(text) {
    const nodes = config.ollama.nodes;
    let lastError = null;
    
    for (let i = 0; i < nodes.length; i++) {
        const node = getNextNode();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), EMBED_TIMEOUT_MS);

        try {
            const response = await fetch(`http://${node}/api/embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: config.embedding.model,
                    prompt: text,
                    options: { num_ctx: 32768 }
                }),
                signal: controller.signal
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.embedding;
        } catch (e) {
            lastError = e;
            continue;
        } finally {
            clearTimeout(timer);
        }
    }

    const reason = lastError?.name === 'AbortError' ? 'timeout' : lastError?.message || 'unknown error';
    console.error(`Embedding failed across all nodes (${reason}), falling back to zero vector`);
    return Array(config.embedding.dimension).fill(0.0);
}
