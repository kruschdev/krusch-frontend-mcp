/**
 * @module embed
 * Ollama bge-large embedding client with AbortController timeout and configurable fleet routing.
 * Configure via OLLAMA_NODES env var (comma-separated) or OLLAMA_URL for single-node setups.
 */
import { config } from '../config.js';
import { httpPost } from '../lib/httpClient.js';

const EMBED_TIMEOUT_MS = 15_000;
let currentNodeIndex = 0;

function getNextNode() {
    const nodes = config.ollama.nodes;
    const node = nodes[currentNodeIndex];
    currentNodeIndex = (currentNodeIndex + 1) % nodes.length;
    return node;
}

/**
 * Log an embedding failure across nodes with explicit reason and node context.
 * @param {Error|null} error
 * @param {string} [node]
 * @returns {string} Formatted log message.
 */
export function logEmbeddingFailure(error, node = 'all') {
    const reason = error?.name === 'AbortError' ? 'timeout' : error?.message || 'unknown error';
    const message = `Embedding failed across all nodes (last node: ${node}, reason: ${reason}), falling back to zero vector`;
    console.error(message);
    return message;
}

/**
 * Check whether an embedding vector is missing, empty, or all zeros.
 * @param {number[]} vec
 * @returns {boolean}
 */
export function isZeroVector(vec) {
    return !Array.isArray(vec) || vec.length === 0 || vec.every((v) => v === 0);
}

/**
 * Generate an embedding vector for the given text via Ollama.
 * Uses round-robin routing across configured nodes and falls back
 * to a zero vector on timeout or network failure across all nodes.
 * @param {string} text - The text to embed.
 * @returns {Promise<number[]>} The embedding vector.
 */
export async function getEmbedding(text) {
    if (!config?.embedding?.model || typeof config.embedding.model !== 'string') {
        throw new Error('Invalid embedding configuration: config.embedding.model is required');
    }
    const nodes = config.ollama.nodes;
    let lastError = null;
    let lastNode = 'none';
    
    for (let i = 0; i < nodes.length; i++) {
        const node = getNextNode();
        lastNode = node;
        const baseUrl = /^https?:\/\//.test(node)
            ? node.replace(/\/+$/, '')
            : `http://${node.replace(/\/+$/, '')}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), EMBED_TIMEOUT_MS);

        try {
            let response = await httpPost(
                `${baseUrl}/api/embed`,
                {
                    model: config.embedding.model,
                    input: text,
                    prompt: text,
                    truncate: true,
                    keep_alive: -1,
                    ...(config.embedding.model.startsWith('qwen3-embedding') ? { dimensions: config.embedding.dimension } : {})
                },
                controller.signal
            );

            if (response.status === 404) {
                response = await httpPost(
                    `${baseUrl}/api/embeddings`,
                    {
                        model: config.embedding.model,
                        prompt: text,
                        truncate: true,
                        keep_alive: -1
                    },
                    controller.signal
                );
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const vec = Array.isArray(data.embeddings?.[0]) ? data.embeddings[0] : data.embedding;
            if (!Array.isArray(vec) || vec.length === 0) {
                throw new Error('Invalid embedding payload returned from Ollama');
            }
            return vec;
        } catch (e) {
            lastError = e;
            continue;
        } finally {
            clearTimeout(timer);
        }
    }

    logEmbeddingFailure(lastError, lastNode);
    return Array(config.embedding.dimension).fill(0.0);
}
