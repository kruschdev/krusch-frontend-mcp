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

test('initDb + resetDbForTest + second ":memory:" DB isolates state cleanly without table leakage', () => {
    resetDbForTest();
    try {
        const db1 = initDb(':memory:');
        run('CREATE TABLE isolated_tokens (id INTEGER PRIMARY KEY, token TEXT)');
        run('INSERT INTO isolated_tokens (token) VALUES (?)', ['color-primary']);
        assert.equal(query('SELECT * FROM isolated_tokens').length, 1);

        resetDbForTest();
        assert.throws(() => getDb(), /Database not initialized/);

        const db2 = initDb(':memory:');
        assert.notEqual(db2, db1);
        const leakedTables = query(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'isolated_tokens'"
        );
        assert.equal(leakedTables.length, 0);
        assert.throws(() => query('SELECT * FROM isolated_tokens'), /no such table: isolated_tokens/);

        // Directly closing the handle must not wedge getDb() or subsequent initDb() calls
        db2.close();
        assert.throws(() => getDb(), /Database not initialized/);
        const db3 = initDb(':memory:');
        assert.equal(db3.open, true);
        assert.notEqual(db3, db2);
    } finally {
        resetDbForTest();
    }
});
