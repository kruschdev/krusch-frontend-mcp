/**
 * @module lib/db
 * Standalone SQLite database wrapper using better-sqlite3.
 * Provides a lightweight singleton for common CRUD patterns.
 */

import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname, isAbsolute } from 'path';

/** @type {Database.Database|null} */
let _db = null;

/**
 * Validate `dbPath` before opening a SQLite connection (SEC-01).
 * Accepts `':memory:'` or a strict absolute filesystem path free of `'..'` traversal segments.
 *
 * @param {string} dbPath - Candidate database path.
 * @returns {string} Validated database path.
 * @throws {Error} When `dbPath` is missing, relative, or contains traversal segments.
 */
export function validateDbPath(dbPath) {
    if (typeof dbPath !== 'string' || dbPath.trim().length === 0 || dbPath.includes('\0')) {
        throw new Error('Invalid dbPath: must be a non-empty string');
    }
    if (dbPath === ':memory:') {
        return dbPath;
    }
    const segments = dbPath.split(/[\\/]+/);
    if (!isAbsolute(dbPath) || segments.includes('..')) {
        throw new Error('Invalid dbPath: must be an absolute path without directory traversal ("..") segments');
    }
    return dbPath;
}

class AsyncMutex {
    constructor() {
        this._queue = Promise.resolve();
    }

    runExclusive(fn) {
        const next = this._queue.then(() => fn());
        this._queue = next.then(
            () => undefined,
            () => undefined
        );
        return next;
    }
}

export const initLock = new AsyncMutex();

/**
 * Initialize (or retrieve) the database connection synchronously.
 * Pre-condition: `dbPath` must be `':memory:'` or an absolute path without `'..'` segments.
 *
 * @param {string} dbPath - Absolute path to the SQLite database file or `':memory:'`.
 * @param {object} [options] - better-sqlite3 options.
 * @param {boolean} [options.wal=true] - Enable WAL mode for better concurrent reads.
 * @returns {Database.Database} Database instance.
 * @throws {Error} If `dbPath` fails security validation.
 */
export function initDb(dbPath, options = {}) {
    validateDbPath(dbPath);
    if (_db) return _db;

    if (dbPath !== ':memory:') {
        mkdirSync(dirname(dbPath), { recursive: true });
    }
    _db = new Database(dbPath);

    if (options.wal !== false && dbPath !== ':memory:') {
        _db.pragma('journal_mode = WAL');
    }
    _db.pragma('foreign_keys = ON');

    return _db;
}

/**
 * Initialize (or retrieve) the database connection under an async mutex lock.
 * Pre-condition: `dbPath` must be `':memory:'` or an absolute path without `'..'` segments.
 *
 * @param {string} dbPath - Absolute path to the SQLite database file or `':memory:'`.
 * @param {object} [options] - better-sqlite3 options.
 * @returns {Promise<Database.Database>} Database instance.
 * @throws {Error} If `dbPath` fails security validation.
 */
export async function initDbAsync(dbPath, options = {}) {
    validateDbPath(dbPath);
    return initLock.runExclusive(() => initDb(dbPath, options));
}

export function resetDbForTest() {
    if (_db && typeof _db.close === 'function') {
        try {
            _db.close();
        } catch {
            // ignore close error in test cleanup
        }
    }
    _db = null;
}

/**
 * Get the current database instance.
 * @returns {Database.Database} Database instance.
 * @throws {Error} If database hasn't been initialized.
 */
export function getDb() {
    if (!_db) throw new Error('Database not initialized. Call initDb() first.');
    return _db;
}

/**
 * Run a SQL statement (INSERT, UPDATE, DELETE, CREATE).
 * @param {string} sql - SQL statement.
 * @param {Array} [params=[]] - Bound parameters.
 * @returns {{ lastInsertRowid: number, changes: number }}
 */
export function run(sql, params = []) {
    const stmt = getDb().prepare(sql);
    const result = stmt.run(...params);
    return {
        lastInsertRowid: Number(result.lastInsertRowid),
        changes: result.changes,
    };
}

/**
 * Query multiple rows.
 * @param {string} sql - SQL query.
 * @param {Array} [params=[]] - Bound parameters.
 * @returns {object[]} Array of row objects.
 */
export function query(sql, params = []) {
    return getDb().prepare(sql).all(...params);
}

/**
 * Execute raw SQL (multiple statements, no parameters).
 * Use for schema definitions and migrations.
 * @param {string} sql - SQL statements.
 */
export function exec(sql) {
    getDb().exec(sql);
}
