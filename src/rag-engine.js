import { initDb, query, run, getDb as getRawDb, exec } from './lib/db.js';
import * as sqliteVec from 'sqlite-vec';
import { config, MEMORY_DB_PATH } from './config.js';

let dbPromise = null;

const DEFAULT_DB_INIT_TIMEOUT_MS = 10_000;
const MAX_FTS5_RAW_QUERY_CHARS = 2048;
const FTS5_TOKEN_PATTERN = /[\p{L}\p{N}_]+/gu;
const FTS5_STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'how',
    'in', 'is', 'it', 'of', 'on', 'or', 'should', 'that', 'the', 'to', 'use',
    'what', 'when', 'where', 'which', 'with'
]);

/**
 * Sanitize untrusted free-text user input into a deterministic SQLite FTS5 `MATCH` expression
 * that cannot throw `fts5: syntax error` on boolean keywords, colons, operators, or unclosed quotes.
 *
 * @param {string} [rawQuery=''] - Raw user search query
 * @param {'AND'|'OR'} [operator='OR'] - Boolean join operator
 * @returns {string} Escaped FTS5 query string, or `''` when no alphanumeric tokens exist
 */
export function escapeFts5Query(rawQuery = '', operator = 'OR') {
    const boundedInput = String(rawQuery ?? '').slice(0, MAX_FTS5_RAW_QUERY_CHARS);
    const matches = boundedInput.match(FTS5_TOKEN_PATTERN);
    if (!matches || matches.length === 0) {
        return '';
    }
    const filtered = matches
        .map((t) => t.toLowerCase())
        .filter((t) => t.length > 1 && !FTS5_STOP_WORDS.has(t));
    const tokens = (filtered.length > 0 ? filtered : matches).slice(0, 32);
    const uniqueTokens = [...new Set(tokens)];
    const quotedTokens = uniqueTokens.map((token) => `"${token.replace(/"/g, '""')}"*`);
    return quotedTokens.join(` ${operator === 'AND' ? 'AND' : 'OR'} `);
}

/**
 * Fuse multiple ranked retrieval lists (e.g., FTS5 BM25 + dense sqlite-vec cosine results)
 * using Reciprocal Rank Fusion: `sum_i weight_i / (k + rank_i)` (`1`-indexed `rank`).
 *
 * @param {Array<Array<object>>} rankedLists
 * @param {{ k?: number, limit?: number, weights?: number[] }} [options]
 * @returns {Array<object>}
 */
export function fuseRrfResults(rankedLists = [], { k = 60, limit = 5, weights = [1, 1] } = {}) {
    const fusedMap = new Map();

    for (let listIdx = 0; listIdx < rankedLists.length; listIdx++) {
        const list = rankedLists[listIdx];
        if (!Array.isArray(list)) continue;
        const weight = Number.isFinite(weights[listIdx]) && weights[listIdx] > 0 ? weights[listIdx] : 1;

        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            if (!item || item.id === undefined || item.id === null) continue;
            const rank = i + 1;
            const rrfIncrement = weight / (k + rank);
            const existing = fusedMap.get(item.id);
            if (!existing) {
                fusedMap.set(item.id, {
                    item: { ...item },
                    rrfScore: rrfIncrement,
                    maxConfidence: Number.isFinite(item.confidence) ? item.confidence : 0.65,
                });
            } else {
                existing.rrfScore += rrfIncrement;
                if (Number.isFinite(item.confidence) && item.confidence > existing.maxConfidence) {
                    existing.maxConfidence = item.confidence;
                    existing.item = { ...existing.item, ...item };
                }
            }
        }
    }

    return [...fusedMap.values()]
        .sort((a, b) => b.rrfScore - a.rrfScore || b.maxConfidence - a.maxConfidence || a.item.id - b.item.id)
        .slice(0, limit)
        .map(({ item, rrfScore, maxConfidence }) => ({
            ...item,
            confidence: parseFloat(Math.max(maxConfidence, Math.min(0.99, 0.5 + rrfScore * 15)).toFixed(2)),
        }));
}

/**
 * Reset the cached rag-engine initialization promise for isolated unit tests.
 */
export function resetRagEngineForTest() {
    dbPromise = null;
}

/**
 * Initialize the SQLite database with sqlite-vec extension and FTS5 lexical index.
 * Uses a cached Promise to guarantee exactly one initialization
 * even under concurrent calls, with timeout and AbortSignal support (ARCH-01).
 * @param {{ timeoutMs?: number, signal?: AbortSignal }} [options]
 * @returns {Promise<true>}
 */
export async function getDb(options = {}) {
    if (options?.signal?.aborted) {
        throw new Error('Database initialization aborted via AbortSignal');
    }
    let rawCheck = null;
    try {
        rawCheck = getRawDb();
    } catch {
        rawCheck = null;
    }
    if (!rawCheck) {
        dbPromise = null;
    }
    if (!dbPromise) {
        const timeoutMs = Number.isFinite(options?.timeoutMs) && options.timeoutMs > 0
            ? options.timeoutMs
            : DEFAULT_DB_INIT_TIMEOUT_MS;
        let timer = null;
        const initTask = (async () => {
            // Allow config override for test isolation
            const dbPath = config.memoryDbPath || MEMORY_DB_PATH;
            await initDb(dbPath);
            const rawDb = getRawDb();
            
            // Load sqlite-vec extension
            sqliteVec.load(rawDb);
            
            // Create base table for design rules and tokens
            exec(`
                CREATE TABLE IF NOT EXISTS frontend_rag (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type TEXT NOT NULL,          -- 'design_rule' or 'figma_token'
                    content TEXT NOT NULL,       -- Semantic content
                    metadata TEXT NOT NULL,      -- JSON string of extra data
                    parent_id INTEGER REFERENCES frontend_rag(id),
                    version_id INTEGER DEFAULT 1,
                    status TEXT DEFAULT 'active',
                    action_trace TEXT,           -- JSON string of actions that created this state
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                
                -- Virtual table for high-performance vector search
                CREATE VIRTUAL TABLE IF NOT EXISTS frontend_rag_vec USING vec0(
                    id INTEGER PRIMARY KEY,
                    embedding float[${config.embedding.dimension}]
                );

                -- Virtual table for zero-network lexical BM25 search & Hybrid RRF
                CREATE VIRTUAL TABLE IF NOT EXISTS frontend_rag_fts USING fts5(
                    content,
                    category,
                    paradigm
                );
            `);

            // Apply migrations for existing databases (only ignore duplicate column errors)
            const alterStatements = [
                'ALTER TABLE frontend_rag ADD COLUMN parent_id INTEGER REFERENCES frontend_rag(id)',
                'ALTER TABLE frontend_rag ADD COLUMN version_id INTEGER DEFAULT 1',
                'ALTER TABLE frontend_rag ADD COLUMN status TEXT DEFAULT "active"',
                'ALTER TABLE frontend_rag ADD COLUMN action_trace TEXT'
            ];
            for (const stmt of alterStatements) {
                try {
                    run(stmt);
                } catch (e) {
                    if (!/duplicate column name/i.test(String(e?.message || e))) {
                        console.error('[rag-engine] Schema migration error:', e);
                        throw e;
                    }
                }
            }

            // Backfill FTS5 index for any existing rows in frontend_rag not yet indexed
            const missingFts = query(`
                SELECT r.id, r.content, r.metadata
                FROM frontend_rag r
                WHERE r.status = 'active'
                  AND r.id NOT IN (SELECT rowid FROM frontend_rag_fts)
            `);
            for (const row of missingFts) {
                let meta = {};
                try {
                    meta = JSON.parse(row.metadata || '{}');
                } catch {
                    meta = {};
                }
                run(
                    `INSERT INTO frontend_rag_fts (rowid, content, category, paradigm) VALUES (?, ?, ?, ?)`,
                    [row.id, row.content, String(meta.category || ''), String(meta.paradigm || 'universal')]
                );
            }

            return true;
        })();

        const timeoutPromise = new Promise((_, reject) => {
            timer = setTimeout(() => {
                dbPromise = null;
                reject(new Error(`Database initialization timed out after ${timeoutMs}ms`));
            }, timeoutMs);
            if (typeof timer.unref === 'function') timer.unref();
        });

        dbPromise = Promise.race([initTask, timeoutPromise]).then(
            (res) => {
                if (timer) clearTimeout(timer);
                return res;
            },
            (err) => {
                if (timer) clearTimeout(timer);
                dbPromise = null;
                throw err;
            }
        );
    }
    return dbPromise;
}

export async function addRagItem(type, content, metadata, embeddingVector = null, parentId = null, actionTrace = null) {
    await getDb();
    
    let versionId = 1;
    if (parentId) {
        const parent = query('SELECT version_id, status FROM frontend_rag WHERE id = ?', [parentId])[0];
        if (!parent) throw new Error(`Parent ID ${parentId} not found`);
        if (parent.status !== 'active') throw new Error(`Parent ID ${parentId} is no longer active`);
        versionId = parent.version_id + 1;
        run(`UPDATE frontend_rag SET status = 'deprecated' WHERE id = ?`, [parentId]);
        run(`DELETE FROM frontend_rag_fts WHERE rowid = ?`, [parentId]);
    }

    const safeMeta = metadata && typeof metadata === 'object' ? metadata : {};

    // Insert into base table
    const { lastInsertRowid } = run(
        `INSERT INTO frontend_rag (type, content, metadata, parent_id, version_id, status, action_trace) VALUES (?, ?, ?, ?, ?, 'active', ?)`,
        [type, content, JSON.stringify(safeMeta), parentId, versionId, actionTrace ? JSON.stringify(actionTrace) : null]
    );

    // Index in FTS5 for zero-network BM25 & Hybrid RRF
    run(
        `INSERT INTO frontend_rag_fts (rowid, content, category, paradigm) VALUES (?, ?, ?, ?)`,
        [lastInsertRowid, content, String(safeMeta.category || ''), String(safeMeta.paradigm || 'universal')]
    );
    
    const hasNonZeroVector =
        Array.isArray(embeddingVector) &&
        embeddingVector.length === config.embedding.dimension &&
        embeddingVector.some((v) => v !== 0);

    if (hasNonZeroVector) {
        // Insert into vector table using Float32Array buffer for sqlite-vec
        const buf = Buffer.from(new Float32Array(embeddingVector).buffer);
        run(
            `INSERT INTO frontend_rag_vec (id, embedding) VALUES (?, ?)`,
            [BigInt(lastInsertRowid), buf]
        );
    }
    
    return lastInsertRowid;
}

/**
 * Search design rules using FTS5 BM25 lexical matching.
 * Works 100% offline with zero external embedding/LLM dependencies.
 *
 * @param {string} queryText
 * @param {number} [limit=5]
 * @param {string|null} [paradigm=null]
 * @returns {Promise<Array<object>>}
 */
export async function searchRagFts(queryText, limit = 5, paradigm = null) {
    await getDb();
    const ftsQuery = escapeFts5Query(queryText, 'OR');
    if (!ftsQuery) return [];

    let sql = `
        SELECT
            r.id,
            r.type,
            r.content,
            r.metadata,
            r.version_id,
            r.status,
            bm25(frontend_rag_fts, 10.0, 3.0, 1.0) as bm25_rank
        FROM frontend_rag_fts
        JOIN frontend_rag r ON r.id = frontend_rag_fts.rowid
        WHERE frontend_rag_fts MATCH ? AND r.status = 'active'
    `;
    const params = [ftsQuery];

    if (paradigm) {
        sql += ` AND (json_extract(r.metadata, '$.paradigm') = ? OR json_extract(r.metadata, '$.paradigm') = 'universal')`;
        params.push(paradigm);
    }

    sql += ` ORDER BY bm25_rank ASC LIMIT ?`;
    params.push(limit);

    try {
        const rows = query(sql, params);
        return rows.map((r, idx) => {
            const rawRank = Math.abs(Number(r.bm25_rank) || 0);
            const normalizedScore = Math.min(0.95, Math.max(0.55, 0.88 - idx * 0.05 + Math.min(0.07, rawRank * 0.005)));
            return {
                id: r.id,
                type: r.type,
                content: r.content,
                metadata: JSON.parse(r.metadata),
                version_id: r.version_id,
                status: r.status,
                confidence: parseFloat(normalizedScore.toFixed(2)),
            };
        });
    } catch {
        return [];
    }
}

export async function searchRag(queryVector, limit = 5, minConfidence = 0.7, paradigm = null, queryText = null) {
    await getDb();
    
    const hasValidVector =
        Array.isArray(queryVector) &&
        queryVector.length === config.embedding.dimension &&
        queryVector.some((v) => v !== 0);

    let vectorResults = [];
    if (hasValidVector) {
        const queryBuffer = Buffer.from(new Float32Array(queryVector).buffer);
        
        let querySql = `
            SELECT 
                r.id, 
                r.type, 
                r.content, 
                r.metadata, 
                r.version_id,
                r.status,
                (1.0 - vec_distance_cosine(v.embedding, ?)) as score
            FROM frontend_rag_vec v
            JOIN frontend_rag r ON r.id = v.id
            WHERE score >= ? AND r.status = 'active'
        `;

        const queryParams = [queryBuffer, minConfidence];

        if (paradigm) {
            querySql += ` AND (json_extract(r.metadata, '$.paradigm') = ? OR json_extract(r.metadata, '$.paradigm') = 'universal')`;
            queryParams.push(paradigm);
        }

        querySql += ` ORDER BY score DESC LIMIT ?`;
        queryParams.push(limit * 2);

        const rows = query(querySql, queryParams);

        vectorResults = rows.map(r => ({
            id: r.id,
            type: r.type,
            content: r.content,
            metadata: JSON.parse(r.metadata),
            version_id: r.version_id,
            status: r.status,
            confidence: parseFloat(r.score.toFixed(2))
        }));
    }

    const ftsResults = (typeof queryText === 'string' && queryText.trim().length > 0)
        ? await searchRagFts(queryText, limit * 2, paradigm)
        : [];

    if (vectorResults.length > 0 && ftsResults.length > 0) {
        return fuseRrfResults([vectorResults, ftsResults], { k: 60, limit, weights: [1.2, 1.0] });
    }
    if (vectorResults.length > 0) {
        return vectorResults.slice(0, limit);
    }
    return ftsResults.slice(0, limit);
}

export async function getProvenance(id) {
    await getDb();
    
    const rows = query(`
        WITH RECURSIVE lineage AS (
            SELECT id, type, content, parent_id, version_id, status, action_trace, created_at, 0 as distance
            FROM frontend_rag
            WHERE id = ?
            
            UNION ALL
            
            SELECT p.id, p.type, p.content, p.parent_id, p.version_id, p.status, p.action_trace, p.created_at, l.distance + 1
            FROM frontend_rag p
            INNER JOIN lineage l ON l.parent_id = p.id
        )
        SELECT * FROM lineage ORDER BY distance ASC;
    `, [id]);

    if (rows.length === 0) return { error: `ID ${id} not found.` };

    let output = `=== 📜 Provenance Trace for ID: ${id} ===\n\n`;
    for (const r of rows) {
        output += `[Ver ${r.version_id}] ID: ${r.id} | Status: ${r.status} | Created: ${r.created_at}\n`;
        if (r.action_trace) {
            output += `Action Trace: ${r.action_trace}\n`;
        }
        output += `Content snippet: ${r.content.substring(0, 100)}...\n\n`;
        if (r.parent_id) {
            output += `  ↑ Derived from parent ID: ${r.parent_id}\n\n`;
        }
    }
    return { output: output.trim() };
}

export async function traverseGraph(id, direction = 'all', depth = 3) {
    await getDb();
    
    const baseRows = query(`SELECT id, type, version_id, status FROM frontend_rag WHERE id = ?`, [id]);
    if (baseRows.length === 0) return { error: `ID ${id} not found.` };
    const base = baseRows[0];

    let output = `=== 🕸️ Graph Traversal for ID: ${id} (Direction: ${direction}) ===\n\n`;
    output += `[Base Node] ID: ${base.id} (Ver ${base.version_id}) | Type: ${base.type} | Status: ${base.status}\n\n`;

    if (direction === 'parents' || direction === 'all') {
        const parents = query(`
            WITH RECURSIVE parents AS (
                SELECT id, parent_id, version_id, status, type, 1 as level
                FROM frontend_rag
                WHERE id = ?
                
                UNION ALL
                
                SELECT p.id, p.parent_id, p.version_id, p.status, p.type, l.level + 1
                FROM frontend_rag p
                INNER JOIN parents l ON l.parent_id = p.id
                WHERE l.level < ?
            )
            SELECT * FROM parents WHERE level > 1 ORDER BY level ASC;
        `, [id, depth + 1]);

        output += `--- ⬆️ Parents (Depth ${depth}) ---\n`;
        if (parents.length === 0) output += `No parents found.\n`;
        for (const p of parents) {
            const indent = '  '.repeat(p.level - 1);
            output += `${indent}└─> ID: ${p.id} (Ver ${p.version_id}) | Type: ${p.type} | Status: ${p.status}\n`;
        }
        output += `\n`;
    }

    if (direction === 'children' || direction === 'all') {
        const children = query(`
            WITH RECURSIVE children AS (
                SELECT id, parent_id, version_id, status, type, 1 as level
                FROM frontend_rag
                WHERE parent_id = ?
                
                UNION ALL
                
                SELECT c.id, c.parent_id, c.version_id, c.status, c.type, l.level + 1
                FROM frontend_rag c
                INNER JOIN children l ON c.parent_id = l.id
                WHERE l.level < ?
            )
            SELECT * FROM children ORDER BY level ASC;
        `, [id, depth]);

        output += `--- ⬇️ Children (Depth ${depth}) ---\n`;
        if (children.length === 0) output += `No children found.\n`;
        for (const c of children) {
            const indent = '  '.repeat(c.level);
            output += `${indent}└─> ID: ${c.id} (Ver ${c.version_id}) | Type: ${c.type} | Status: ${c.status}\n`;
        }
        output += `\n`;
    }

    return { output: output.trim() };
}


