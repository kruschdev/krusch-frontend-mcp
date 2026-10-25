import test from 'node:test';
import assert from 'node:assert/strict';
import { runSwarmEvaluation } from '../scripts/evaluate-swarm.js';

test('runSwarmEvaluation logs tool error and throws when rulesResponse.isError is true (TEST-01)', async () => {
    const errors = [];
    const origError = console.error;
    console.error = (...args) => errors.push(args);

    let closed = false;
    const mockTransport = {
        close: async () => { closed = true; }
    };
    const mockClient = {
        connect: async () => {},
        callTool: async () => ({
            isError: true,
            content: [{ text: 'Simulated RAG failure' }]
        })
    };

    try {
        await assert.rejects(
            () => runSwarmEvaluation({ client: mockClient, transport: mockTransport }),
            /Tool failed/
        );
        assert.equal(closed, true);
        assert.ok(errors.some(args => String(args[0]).includes('Tool Error: Simulated RAG failure')));
    } finally {
        console.error = origError;
    }
});

test('runSwarmEvaluation logs parse error and throws on malformed rulesResponse JSON (SEC-02, TEST-01)', async () => {
    const errors = [];
    const origError = console.error;
    console.error = (...args) => errors.push(args);

    let closed = false;
    const mockTransport = {
        close: async () => { closed = true; }
    };
    const mockClient = {
        connect: async () => {},
        callTool: async () => ({
            isError: false,
            content: [{ text: '{malformed-json' }]
        })
    };

    try {
        await assert.rejects(
            () => runSwarmEvaluation({ client: mockClient, transport: mockTransport }),
            SyntaxError
        );
        assert.equal(closed, true);
        assert.ok(errors.some(args => String(args[0]).includes('Failed to parse rulesResponse:')));
    } finally {
        console.error = origError;
    }
});
