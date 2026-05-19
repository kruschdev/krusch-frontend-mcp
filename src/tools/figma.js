import { addRagItem } from '../rag-engine.js';
import { getEmbedding } from './embed.js';

/**
 * Parse and ingest Figma design tokens into the RAG vector store.
 * Flattens nested token JSON, embeds each token via Ollama, and stores
 * in the frontend_rag + frontend_rag_vec tables.
 * @param {string} tokensJsonStr - Stringified Figma JSON token export.
 * @returns {Promise<{ status: string, ingested: number }>}
 */
export async function ingestFigmaTokens(tokensJsonStr) {
    let tokens;
    try {
        tokens = JSON.parse(tokensJsonStr);
    } catch(e) {
        throw new Error("Invalid JSON tokens");
    }

    const flatTokens = [];
    function flatten(obj, prefix = '') {
        for (const [key, value] of Object.entries(obj)) {
            if (value && typeof value === 'object' && value.value !== undefined) {
                flatTokens.push({ name: prefix + key, value: value.value, type: value.type || 'unknown' });
            } else if (value && typeof value === 'object') {
                flatten(value, prefix + key + '-');
            }
        }
    }
    flatten(tokens);

    let count = 0;
    for (const token of flatTokens) {
        const content = `Design Token: ${token.name}. Type: ${token.type}. Value: ${token.value}`;
        const vec = await getEmbedding(content);
        await addRagItem('figma_token', content, token, vec);
        count++;
    }
    return { status: "success", ingested: count };
}

/**
 * Parses a Figma tokens JSON string and generates a CSS :root block
 * with CSS custom properties (variables) for each token.
 * @param {string} tokensJsonStr 
 * @returns {string} CSS variables block
 */
export function generateCssVariables(tokensJsonStr) {
    let tokens;
    try {
        tokens = JSON.parse(tokensJsonStr);
    } catch(e) {
        throw new Error("Invalid JSON tokens");
    }

    const cssVars = [];
    function flatten(obj, prefix = '') {
        for (const [key, value] of Object.entries(obj)) {
            // Check for actual token nodes vs groups
            if (value && typeof value === 'object' && value.value !== undefined) {
                // convert camelCase/PascalCase to kebab-case
                const kebabKey = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
                const cleanPrefix = prefix.replace(/-$/, '');
                const varName = cleanPrefix ? `${cleanPrefix}-${kebabKey}` : kebabKey;
                cssVars.push(`  --${varName}: ${value.value};`);
            } else if (value && typeof value === 'object') {
                // Convert group name to kebab-case
                const kebabKey = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
                flatten(value, prefix + kebabKey + '-');
            }
        }
    }
    flatten(tokens);

    return `:root {\n${cssVars.join('\n')}\n}`;
}
