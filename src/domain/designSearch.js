/**
 * @module domain/designSearch
 * Domain-layer facade for semantic search over ingested design rules (ARCH-01).
 */
import { searchProvider } from '../infrastructure/ragAdapter.js';

/**
 * Search design rules using a precomputed embedding vector.
 * @param {number[]} vec - Query embedding vector.
 * @param {number} [k=5] - Number of top results.
 * @param {number} [threshold=0.5] - Minimum cosine similarity threshold.
 * @param {string|null} [paradigm=null] - Optional paradigm filter.
 * @returns {Promise<Array<{content: string, confidence: number}>>}
 */
export async function searchDesignRules(vec, k = 5, threshold = 0.5, paradigm = null) {
    return searchProvider(vec, k, threshold, paradigm);
}
