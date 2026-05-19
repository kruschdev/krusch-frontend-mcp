/**
 * @module component-styles
 * LLM-assisted component style generator.
 * Takes a component description and returns CSS variables + properties.
 */
import { chat } from '../lib/llm.js';
import { queryDesignRules } from './design-rules.js';

export const _deps = { chat, queryDesignRules };

const COMPONENT_TIMEOUT_MS = 30_000;

const ollamaConfig = {
    provider: 'ollama',
    model: 'qwen2.5-coder:1.5b',
    temperature: 0.4,
    maxTokens: 2000,
    timeout: COMPONENT_TIMEOUT_MS,
};

const SYSTEM_PROMPT = `You are an expert CSS engineer. Given a component description, generate:
1. CSS custom properties (variables) with the --component- prefix
2. A CSS class with all necessary properties to achieve the described aesthetic
3. Any pseudo-element or state styles needed (hover, focus, active)

Use modern CSS. Be specific with values (not generic). Output only valid CSS code blocks.`;

/**
 * Generate CSS styles for a described component aesthetic.
 * Optionally enriches the prompt with RAG-retrieved design rules.
 * @param {string} description - Component description (e.g. "glassmorphism card with hover lift")
 * @param {string|null} paradigm - Optional design paradigm filter for RAG retrieval.
 * @returns {Promise<{css: string, design_context: Array} | {error: string}>}
 */
export async function generateComponentStyles(description, paradigm = null) {
    try {
        // Enrich with relevant design rules from RAG
        let designContext = [];
        try {
            designContext = await _deps.queryDesignRules(description, paradigm);
        } catch {
            // RAG unavailable — proceed without context
        }

        const ragContext = designContext.length > 0
            ? `\n\nRelevant design rules to follow:\n${designContext.map(r => `- ${r.rule}`).join('\n')}`
            : '';

        const response = await _deps.chat(
            SYSTEM_PROMPT,
            `Component: ${description}${ragContext}\n\nGenerate the CSS:`,
            ollamaConfig
        );

        return {
            css: response,
            design_context: designContext,
        };
    } catch (e) {
        const reason = e.name === 'AbortError' ? 'timeout' : e.message;
        return { error: `Failed to generate component styles: ${reason}` };
    }
}
