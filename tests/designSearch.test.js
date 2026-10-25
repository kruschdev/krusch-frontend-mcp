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
