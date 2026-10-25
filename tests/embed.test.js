import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getEmbedding, logEmbeddingFailure } from '../src/tools/embed.js';
import { config } from '../src/config.js';

describe('embed.js — getEmbedding & logEmbeddingFailure (TEST-01 / BUG-01)', () => {
    it('returns embedding vector on HTTP 200 success', async () => {
        const origFetch = globalThis.fetch;
        const expectedVec = Array(config.embedding.dimension).fill(0.25);
        globalThis.fetch = async () => ({
            ok: true,
            status: 200,
            json: async () => ({ embedding: expectedVec }),
        });

        try {
            const vec = await getEmbedding('test design token');
            assert.deepEqual(vec, expectedVec);
        } finally {
            globalThis.fetch = origFetch;
        }
    });

    it('falls back to zero vector and logs failure on HTTP 404 across all nodes', async () => {
        const origFetch = globalThis.fetch;
        globalThis.fetch = async () => ({
            ok: false,
            status: 404,
            json: async () => ({}),
        });

        try {
            const vec = await getEmbedding('missing model test');
            assert.equal(vec.length, config.embedding.dimension);
            assert.ok(vec.every((v) => v === 0.0));

            const msg = logEmbeddingFailure(new Error('HTTP error! status: 404'), 'localhost:11434');
            assert.match(msg, /HTTP error! status: 404/);
            assert.match(msg, /localhost:11434/);
        } finally {
            globalThis.fetch = origFetch;
        }
    });

    it('falls back to zero vector when AbortError timeout occurs', async () => {
        const origFetch = globalThis.fetch;
        globalThis.fetch = async () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            throw err;
        };

        try {
            const vec = await getEmbedding('timeout test');
            assert.equal(vec.length, config.embedding.dimension);
            assert.ok(vec.every((v) => v === 0.0));
        } finally {
            globalThis.fetch = origFetch;
        }
    });

    it('throws validation error when config.embedding.model is missing', async () => {
        const origModel = config.embedding.model;
        config.embedding.model = '';
        try {
            await assert.rejects(() => getEmbedding('invalid config'), /config\.embedding\.model is required/);
        } finally {
            config.embedding.model = origModel;
        }
    });

    it('ARCH-02: initDbAsync serializes concurrent initializations and returns a single singleton instance', async () => {
        const os = await import('node:os');
        const path = await import('node:path');
        const fs = await import('node:fs');
        const { initDbAsync, resetDbForTest } = await import('../src/lib/db.js');

        const tmpDb = path.join(os.tmpdir(), `frontend-mcp-test-${process.pid}-${Date.now()}.db`);
        resetDbForTest();
        try {
            const instances = await Promise.all([
                initDbAsync(tmpDb),
                initDbAsync(tmpDb),
                initDbAsync(tmpDb),
                initDbAsync(tmpDb)
            ]);
            assert.strictEqual(instances[0], instances[1]);
            assert.strictEqual(instances[1], instances[2]);
            assert.strictEqual(instances[2], instances[3]);
        } finally {
            resetDbForTest();
            try { fs.rmSync(tmpDb, { force: true }); } catch { /* ignore */ }
        }
    });
});
