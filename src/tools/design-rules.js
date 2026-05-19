/**
 * @module design-rules
 * RAG-powered design rule retrieval with multi-paradigm filtering.
 */
import { searchRag } from '../rag-engine.js';
import { getEmbedding } from './embed.js';

/**
 * Semantic search over ingested design rules.
 * @param {string} queryStr - Natural language query.
 * @param {string|null} paradigm - Optional paradigm filter (e.g. 'refactoring-ui', 'universal').
 * @returns {Promise<Array<{rule: string, confidence: number}>>}
 */
export async function queryDesignRules(queryStr, paradigm = null) {
    const vec = await getEmbedding(queryStr);
    const results = await searchRag(vec, 5, 0.5, paradigm);
    return results.map(r => ({ rule: r.content, confidence: r.confidence }));
}
