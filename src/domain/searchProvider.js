/**
 * @module domain/searchProvider
 * Domain-level search provider contract (ARCH-01).
 */

let activeSearchProvider = null;

/**
 * Register or override the active search provider implementation.
 * @param {(vec: number[], k?: number, threshold?: number, paradigm?: string|null) => Promise<Array<{content: string, confidence: number}>>} fn
 */
export function setSearchProvider(fn) {
    activeSearchProvider = fn;
}

/**
 * Execute semantic search via the configured provider.
 * @param {number[]} vec
 * @param {number} [k=5]
 * @param {number} [threshold=0.5]
 * @param {string|null} [paradigm=null]
 * @returns {Promise<Array<{content: string, confidence: number}>>}
 */
export async function searchProvider(vec, k = 5, threshold = 0.5, paradigm = null) {
    if (typeof activeSearchProvider !== 'function') {
        throw new Error('No searchProvider has been registered');
    }
    return activeSearchProvider(vec, k, threshold, paradigm);
}
