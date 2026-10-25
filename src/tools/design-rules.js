/**
 * @module design-rules
 * RAG-powered design rule retrieval with multi-paradigm filtering.
 */
import { searchDesignRules } from '../domain/designSearch.js';
import { getEmbedding } from './embed.js';

/**
 * Semantic search over ingested design rules.
 * @param {string} queryStr - Natural language query.
 * @param {string|null} paradigm - Optional paradigm filter (e.g. 'refactoring-ui', 'universal').
 * @returns {Promise<Array<{rule: string, confidence: number}>>}
 */
export async function queryDesignRules(queryStr, paradigm = null) {
    if (typeof queryStr !== 'string') {
        throw new Error('Invalid query string');
    }
    const trimmed = queryStr.trim();
    if (trimmed.length === 0 || trimmed.length > 1024) {
        throw new Error('Invalid query string');
    }
    const vec = await getEmbedding(trimmed);
    const results = await searchDesignRules(vec, 5, 0.5, paradigm);
    return results.map(r => ({ rule: r.content, confidence: r.confidence }));
}
