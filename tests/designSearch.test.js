import test from 'node:test';
import assert from 'node:assert/strict';
import { searchDesignRules } from '../src/domain/designSearch.js';
import { setSearchProvider, searchProvider } from '../src/domain/searchProvider.js';
import { searchRag } from '../src/rag-engine.js';
import { httpPost, HttpError } from '../src/lib/httpClient.js';

test('searchDesignRules delegates to registered searchProvider facade (ARCH-01 / TEST-01)', async () => {
    const mockResults = [{ content: 'Use 8px spacing grid', confidence: 0.92 }];
    let capturedArgs = null;

    setSearchProvider(async (vec, k, threshold, paradigm) => {
        capturedArgs = { vec, k, threshold, paradigm };
        return mockResults;
    });

    try {
        const res = await searchDesignRules([0.1, 0.2], 3, 0.4, 'minimal');
        assert.deepEqual(res, mockResults);
        assert.deepEqual(capturedArgs, {
            vec: [0.1, 0.2],
            k: 3,
            threshold: 0.4,
            paradigm: 'minimal',
        });
    } finally {
        setSearchProvider(searchRag);
    }
});

test('httpPost injects JSON Content-Type header and wraps network errors in HttpError (ARCH-02)', async () => {
    const origFetch = globalThis.fetch;
    let recordedHeaders = null;

    globalThis.fetch = async (url, init) => {
        recordedHeaders = init.headers;
        return {
            ok: true,
            status: 200,
            json: async () => ({ status: 'ok' }),
        };
    };

    try {
        const res = await httpPost('http://localhost:11434/api/test', { hello: 'world' });
        assert.equal(res.ok, true);
        assert.equal(recordedHeaders['Content-Type'], 'application/json');
    } finally {
        globalThis.fetch = origFetch;
    }

    globalThis.fetch = async () => {
        throw new Error('ECONNREFUSED');
    };

    try {
        await assert.rejects(
            () => httpPost('http://localhost:11434/api/test', { hello: 'world' }),
            (err) => err instanceof HttpError && /ECONNREFUSED/.test(err.message)
        );
    } finally {
        globalThis.fetch = origFetch;
    }
});

import { escapeFts5Query, fuseRrfResults } from '../src/rag-engine.js';
import { buildDeterministicComponentCss } from '../src/tools/component-styles.js';
import { buildDeterministicLayoutAnalysis } from '../src/tools/layout.js';

test('escapeFts5Query and fuseRrfResults provide injection-safe lexical search and RRF fusion', () => {
    const escaped = escapeFts5Query('Vercel Next.js "App Router" & SSE: (no-store) OR 1=1', 'OR');
    assert.ok(escaped.includes('"vercel"*'));
    assert.ok(escaped.includes('"next"*'));
    assert.ok(escaped.includes('"router"*'));
    assert.equal(escapeFts5Query('   ... !!! '), '');

    const fused = fuseRrfResults([
        [{ id: 10, content: 'Rule A', confidence: 0.82 }, { id: 20, content: 'Rule B', confidence: 0.75 }],
        [{ id: 20, content: 'Rule B', confidence: 0.80 }, { id: 30, content: 'Rule C', confidence: 0.70 }]
    ], { k: 60, limit: 3 });

    assert.equal(fused.length, 3);
    // ID 20 appears in both lists so its RRF score ranks #1
    assert.equal(fused[0].id, 20);
    assert.ok(fused[0].confidence >= 0.80);
});

test('buildDeterministicComponentCss and buildDeterministicLayoutAnalysis produce valid CSS offline', () => {
    const glassCss = buildDeterministicComponentCss('glassmorphism card with hover lift');
    assert.ok(glassCss.includes('--component-bg:'));
    assert.ok(glassCss.includes('backdrop-filter: blur(14px)'));
    assert.ok(glassCss.includes(':hover'));

    const gridLayout = buildDeterministicLayoutAnalysis('<div class="dashboard-grid"></div>');
    assert.ok(gridLayout.includes('display: grid;'));

    const flexLayout = buildDeterministicLayoutAnalysis('<nav class="navbar"></nav>');
    assert.ok(flexLayout.includes('display: flex;'));
});
