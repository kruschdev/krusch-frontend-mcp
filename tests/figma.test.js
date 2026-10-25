import test from 'node:test';
import assert from 'node:assert';
import { join } from 'node:path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { tmpdir } from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use an isolated temp DB — never touch production memory.db
const testDbPath = join(tmpdir(), `figma-test-${Date.now()}.db`);
process.env.MEMORY_DB_PATH = testDbPath;

// Import AFTER setting env so config.js and rag-engine pick up the test path
const { ingestFigmaTokens } = await import('../src/tools/figma.js');
const configMod = await import('../src/config.js');

test('ingestFigmaTokens parses deeply nested tokens', { timeout: 20_000 }, async () => {
    const mockTokens = {
        global: {
            colors: {
                primary: {
                    value: "#ff0000",
                    type: "color"
                }
            }
        }
    };
    
    const result = await ingestFigmaTokens(JSON.stringify(mockTokens));
    assert.strictEqual(result.status, "success");
    assert.strictEqual(result.ingested, 1);
});

test('src/config.js derives ollama.nodes deterministically and omits setTestEnv mutator (ARCH-01, ARCH-02)', () => {
    assert.strictEqual(configMod.setTestEnv, undefined);
    assert.strictEqual(configMod.config.memoryDbPath, testDbPath);
    assert.ok(Array.isArray(configMod.config.ollama.nodes));
    assert.ok(configMod.config.ollama.nodes.length >= 1);
});

