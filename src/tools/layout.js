/**
 * @module layout
 * Ollama-powered HTML → CSS layout analysis.
 */
import { chat } from '../lib/llm.js';

const LAYOUT_TIMEOUT_MS = 30_000;

const ollamaConfig = {
    provider: 'ollama',
    model: 'qwen2.5-coder:7b',
    temperature: 0.3,
    maxTokens: 1500,
    timeout: LAYOUT_TIMEOUT_MS,
};

const SYSTEM_PROMPT = `You are an expert frontend developer. Analyze the provided HTML snippet and recommend the optimal CSS layout approach (Flexbox or Grid). Return the necessary CSS to make it responsive. Be concise.`;

/**
 * Analyze an HTML snippet and recommend optimal CSS layout.
 * @param {string} htmlString - Raw HTML to analyze.
 * @returns {Promise<{suggestion: string} | {error: string}>}
 */
export async function analyzeLayoutStructure(htmlString) {
    try {
        const response = await chat(
            SYSTEM_PROMPT,
            `HTML:\n${htmlString}\n\nCSS Strategy:`,
            ollamaConfig
        );
        return { suggestion: response };
    } catch (e) {
        const reason = e.name === 'AbortError' ? 'timeout' : e.message;
        return { error: `Failed to analyze layout: ${reason}` };
    }
}

