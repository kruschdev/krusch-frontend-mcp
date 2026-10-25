/**
 * @module lib/llm
 * Minimal Ollama chat client via the OpenAI-compatible API.
 * Uses native fetch with AbortController timeout.
 */

import { OLLAMA_URL } from '../config.js';
import { httpPost } from './httpClient.js';

/**
 * @typedef {object} LLMConfig
 * @property {'ollama'} provider - LLM provider (only Ollama supported).
 * @property {string} model - Model name (e.g. 'qwen2.5-coder:1.5b').
 * @property {number} [temperature=0.7] - Sampling temperature.
 * @property {number} [maxTokens=2000] - Maximum output tokens.
 * @property {number} [timeout=30000] - Request timeout in ms.
 */

/**
 * Send a chat message to Ollama via the OpenAI-compatible endpoint.
 * @param {string} systemPrompt - System/role prompt.
 * @param {string} userMessage - User message.
 * @param {LLMConfig} config - Provider configuration.
 * @returns {Promise<string>} Raw text response.
 */
export async function chat(systemPrompt, userMessage, config) {
    const ollamaUrl = config.apiUrl || OLLAMA_URL;
    const url = `${ollamaUrl}/v1/chat/completions`;
    const timeoutMs = config.timeout || 30_000;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await httpPost(
            url,
            {
                model: config.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                stream: false,
                temperature: config.temperature ?? 0.7,
                max_tokens: config.maxTokens ?? 2000,
            },
            controller.signal
        );

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Ollama API ${res.status}: ${err}`);
        }

        const data = await res.json();
        return data.choices?.[0]?.message?.content || '';
    } finally {
        clearTimeout(timer);
    }
}
