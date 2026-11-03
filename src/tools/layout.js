/**
 * @module layout
 * Ollama-powered HTML → CSS layout analysis.
 */
import { chat } from '../lib/llm.js';
import { config } from '../config.js';

export const _deps = { chat };

const LAYOUT_TIMEOUT_MS = config.llm?.timeoutMs || 30_000;

const ollamaConfig = {
    provider: 'ollama',
    model: config.llm?.model || 'qwen2.5-coder:7b',
    temperature: 0.3,
    maxTokens: 1500,
    timeout: LAYOUT_TIMEOUT_MS,
};

const SYSTEM_PROMPT = `You are an expert frontend developer. Analyze the provided HTML snippet and recommend the optimal CSS layout approach (Flexbox or Grid). Return the necessary CSS to make it responsive. Be concise.`;

/**
 * Deterministic AST/DOM heuristic layout analyzer for offline/serverless environments.
 * @param {string} htmlString
 * @returns {string}
 */
export function buildDeterministicLayoutAnalysis(htmlString) {
    const raw = String(htmlString || '');
    const useGrid = /grid|dashboard|gallery|cards|columns|matrix|table/i.test(raw);
    if (useGrid) {
        return `Recommended Approach: CSS Grid (2D responsive dashboard/card layout)

.layout-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
  align-items: stretch;
}`;
    }
    return `Recommended Approach: CSS Flexbox (1D alignment and stack flow)

.layout-flex {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}`;
}

/**
 * Analyze an HTML snippet and recommend optimal CSS layout.
 * @param {string} htmlString - Raw HTML to analyze.
 * @param {{ allowDeterministicFallback?: boolean }} [options]
 * @returns {Promise<{suggestion: string, fallback?: boolean} | {error: string}>}
 */
export async function analyzeLayoutStructure(htmlString, options = {}) {
    try {
        const response = await _deps.chat(
            SYSTEM_PROMPT,
            `HTML:\n${htmlString}\n\nCSS Strategy:`,
            ollamaConfig
        );
        return { suggestion: response };
    } catch (e) {
        if (options?.allowDeterministicFallback === true) {
            return {
                suggestion: buildDeterministicLayoutAnalysis(htmlString),
                fallback: true,
            };
        }
        const reason = e.name === 'AbortError' ? 'timeout' : e.message;
        return { error: `Failed to analyze layout: ${reason}` };
    }
}

