/**
 * @module config
 * Environment-based configuration for krusch-frontend-mcp.
 */

/**
 * Get an environment variable with a fallback default.
 * @param {string} envKey - Environment variable name.
 * @param {*} defaultValue - Fallback value.
 * @returns {*} Resolved value.
 */
function envOr(envKey, defaultValue) {
    const val = process.env[envKey];
    return (val !== undefined && val !== '') ? val : defaultValue;
}

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const MEMORY_DB_PATH = envOr('MEMORY_DB_PATH', join(__dirname, '..', 'memory.db'));

const primaryOllamaUrl = envOr('OLLAMA_URL', 'http://localhost:11434');
const configuredOllamaNodes = envOr('OLLAMA_NODES', '').split(',').filter(Boolean);
// Deterministic fallback: derive default node host from primary OLLAMA_URL once during evaluation (ARCH-02).
const defaultOllamaNode = primaryOllamaUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
const ollamaNodes = configuredOllamaNodes.length ? configuredOllamaNodes : [defaultOllamaNode];

export const config = {
    debug: envOr('DEBUG', 'false') === 'true',
    memoryDbPath: MEMORY_DB_PATH,

    embedding: {
        model: envOr('EMBED_MODEL', 'snowflake-arctic-embed2'),
        dimension: parseInt(envOr('EMBED_DIMENSION', '1024'), 10),
    },

    ollama: {
        /** Primary Ollama URL (used by LLM tools). */
        url: primaryOllamaUrl,
        /**
         * Comma-separated list of Ollama nodes for fleet routing in embed.js.
         * Deterministically falls back to the primary OLLAMA_URL host if not set.
         */
        nodes: ollamaNodes,
    },
};

export const OLLAMA_URL = config.ollama.url;

// Note: Runtime mutation of process.env via helper functions is prohibited (ARCH-01).
// Tests requiring isolated environment overrides must configure process.env prior to module import.



