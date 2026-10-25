import test from 'node:test';
import assert from 'node:assert/strict';
import {
    initDb,
    initDbAsync,
    getDb,
    resetDbForTest,
    validateDbPath,
    run,
    query,
} from '../src/lib/db.js';

test('initDb and initDbAsync reject relative and traversal dbPath values (SEC-01, TEST-01)', async () => {
    resetDbForTest();
    assert.throws(() => validateDbPath(''), /Invalid dbPath/);
    assert.throws(() => validateDbPath('../evil.db'), /Invalid dbPath/);
    assert.throws(() => validateDbPath('relative/test.db'), /Invalid dbPath/);
    assert.throws(() => validateDbPath('/tmp/../etc/evil.db'), /Invalid dbPath/);
    assert.throws(() => initDb('../evil.db'), /Invalid dbPath/);
    await assert.rejects(() => initDbAsync('../evil.db'), /Invalid dbPath/);
});

test('initDb(":memory:") initializes SQLite connection and resetDbForTest clears singleton (TEST-01)', async () => {
    resetDbForTest();
    try {
        const db = initDb(':memory:');
        assert.ok(db, 'initDb(":memory:") must return a Database instance');
        assert.equal(getDb(), db);

        run('CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)');
        const ins = run('INSERT INTO items (name) VALUES (?)', ['alpha']);
        assert.equal(ins.changes, 1);

        const rows = query('SELECT * FROM items WHERE id = ?', [ins.lastInsertRowid]);
        assert.equal(rows.length, 1);
        assert.equal(rows[0].name, 'alpha');

        // Verify resetDbForTest clears _db singleton
        resetDbForTest();
        assert.throws(() => getDb(), /Database not initialized/);

        // Verify initDbAsync works with :memory:
        const asyncDb = await initDbAsync(':memory:');
        assert.ok(asyncDb);
    } finally {
        resetDbForTest();
    }
});
