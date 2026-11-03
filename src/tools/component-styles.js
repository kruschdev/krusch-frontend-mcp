/**
 * @module component-styles
 * LLM-assisted component style generator.
 * Takes a component description and returns CSS variables + properties.
 */
import { chat } from '../lib/llm.js';
import { config } from '../config.js';
import { queryDesignRules } from './design-rules.js';

export const _deps = { chat, queryDesignRules };

const COMPONENT_TIMEOUT_MS = config.llm?.timeoutMs || 30_000;

const ollamaConfig = {
    provider: 'ollama',
    model: config.llm?.model || 'qwen2.5-coder:7b',
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
 * Deterministic zero-network CSS fallback generator for offline/serverless environments.
 * @param {string} description
 * @returns {string}
 */
export function buildDeterministicComponentCss(description) {
    const lower = String(description || '').toLowerCase();
    const isGlass = /glass|blur|frosted|translucent/.test(lower);
    const isButton = /\bbutton\b|\bcta\b|\bpill\b/.test(lower);
    const hasHover = /hover|lift|interactive/.test(lower);

    const bg = isGlass ? 'rgba(15, 23, 42, 0.65)' : '#111827';
    const border = isGlass ? 'rgba(55, 225, 255, 0.24)' : 'rgba(255, 255, 255, 0.12)';
    const padding = isButton ? '0.625rem 1.25rem' : '1.25rem 1.5rem';
    const radius = isButton ? '0.5rem' : '0.875rem';

    let css = `:root {
  --component-bg: ${bg};
  --component-border: ${border};
  --component-text: #f8fafc;
  --component-accent: #37e1ff;
  --component-radius: ${radius};
  --component-padding: ${padding};
  --component-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
}

.component-surface {
  background: var(--component-bg);
  color: var(--component-text);
  border: 1px solid var(--component-border);
  border-radius: var(--component-radius);
  padding: var(--component-padding);
  box-shadow: var(--component-shadow);${isGlass ? '\n  backdrop-filter: blur(14px);\n  -webkit-backdrop-filter: blur(14px);' : ''}
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms ease, box-shadow 200ms ease;
}`;

    if (hasHover || isButton) {
        css += `

.component-surface:hover {
  transform: translateY(-2px);
  border-color: var(--component-accent);
  box-shadow: 0 14px 34px -8px rgba(55, 225, 255, 0.22);
}`;
    }

    css += `

.component-surface:focus-visible {
  outline: 2px solid var(--component-accent);
  outline-offset: 2px;
}`;

    return css;
}

/**
 * Generate CSS styles for a described component aesthetic.
 * Optionally enriches the prompt with RAG-retrieved design rules.
 * @param {string} description - Component description (e.g. "glassmorphism card with hover lift")
 * @param {string|null} paradigm - Optional design paradigm filter for RAG retrieval.
 * @param {{ allowDeterministicFallback?: boolean }} [options]
 * @returns {Promise<{css: string, design_context: Array, fallback?: boolean} | {error: string}>}
 */
export async function generateComponentStyles(description, paradigm = null, options = {}) {
    let designContext = [];
    try {
        designContext = await _deps.queryDesignRules(description, paradigm);
    } catch {
        // RAG unavailable — proceed without context
    }

    try {
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
        if (options?.allowDeterministicFallback === true) {
            return {
                css: buildDeterministicComponentCss(description),
                design_context: designContext,
                fallback: true,
            };
        }
        const reason = e.name === 'AbortError' ? 'timeout' : e.message;
        return { error: `Failed to generate component styles: ${reason}` };
    }
}
