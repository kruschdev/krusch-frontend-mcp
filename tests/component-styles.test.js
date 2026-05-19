import test from 'node:test';
import assert from 'node:assert';
import { generateComponentStyles, _deps } from '../src/tools/component-styles.js';

test('generateComponentStyles returns css and design_context', async (t) => {
    t.mock.method(_deps, 'queryDesignRules', async () => {
        return [{ rule: 'Use var(--component-bg) for backgrounds' }];
    });

    t.mock.method(_deps, 'chat', async () => {
        return '.btn { background: var(--component-bg); }';
    });

    const result = await generateComponentStyles('A simple button');
    
    assert.strictEqual(result.css, '.btn { background: var(--component-bg); }');
    assert.strictEqual(result.design_context.length, 1);
    assert.strictEqual(result.design_context[0].rule, 'Use var(--component-bg) for backgrounds');
});

test('generateComponentStyles handles RAG failure gracefully', async (t) => {
    t.mock.method(_deps, 'queryDesignRules', async () => {
        throw new Error('RAG unavailable');
    });

    t.mock.method(_deps, 'chat', async () => {
        return '.btn { color: red; }';
    });

    const result = await generateComponentStyles('A red button');
    
    assert.strictEqual(result.css, '.btn { color: red; }');
    assert.strictEqual(result.design_context.length, 0);
});

test('generateComponentStyles handles LLM failure gracefully', async (t) => {
    t.mock.method(_deps, 'queryDesignRules', async () => {
        return [];
    });

    t.mock.method(_deps, 'chat', async () => {
        const error = new Error('LLM Timeout');
        error.name = 'AbortError';
        throw error;
    });

    const result = await generateComponentStyles('A timeout button');
    
    assert.strictEqual(result.error, 'Failed to generate component styles: timeout');
});
