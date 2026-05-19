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

export const config = {
    debug: envOr('DEBUG', 'false') === 'true',

    embedding: {
        model: envOr('EMBED_MODEL', 'bge-large'),
        dimension: parseInt(envOr('EMBED_DIMENSION', '1024'), 10),
    },

    ollama: {
        /** Primary Ollama URL (used by LLM tools). */
        url: envOr('OLLAMA_URL', 'http://localhost:11434'),
        /**
         * Comma-separated list of Ollama nodes for fleet routing in embed.js.
         * Falls back to the primary OLLAMA_URL if not set.
         */
        nodes: envOr('OLLAMA_NODES', '').split(',').filter(Boolean),
    },
};

// If no explicit nodes configured, use the primary URL
if (config.ollama.nodes.length === 0) {
    const host = config.ollama.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    config.ollama.nodes = [host];
}
