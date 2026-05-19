import { initDb, query, run, getDb as getRawDb, exec } from './lib/db.js';
import * as sqliteVec from 'sqlite-vec';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let dbPromise = null;

/**
 * Initialize the SQLite database with sqlite-vec extension.
 * Uses a cached Promise to guarantee exactly one initialization
 * even under concurrent calls.
 * @returns {Promise<true>}
 */
export async function getDb() {
    if (!dbPromise) {
        dbPromise = (async () => {
            // Allow env override for test isolation
            const dbPath = process.env.MEMORY_DB_PATH || join(__dirname, '..', 'memory.db');
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
            `);

            // Apply migrations for existing databases
            try { run('ALTER TABLE frontend_rag ADD COLUMN parent_id INTEGER REFERENCES frontend_rag(id)'); } catch (e) { /* ignore if exists */ }
            try { run('ALTER TABLE frontend_rag ADD COLUMN version_id INTEGER DEFAULT 1'); } catch (e) { /* ignore if exists */ }
            try { run('ALTER TABLE frontend_rag ADD COLUMN status TEXT DEFAULT "active"'); } catch (e) { /* ignore if exists */ }
            try { run('ALTER TABLE frontend_rag ADD COLUMN action_trace TEXT'); } catch (e) { /* ignore if exists */ }

            return true;
        })();
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
    }

    // Insert into base table
    const { lastInsertRowid } = run(
        `INSERT INTO frontend_rag (type, content, metadata, parent_id, version_id, status, action_trace) VALUES (?, ?, ?, ?, ?, 'active', ?)`,
        [type, content, JSON.stringify(metadata), parentId, versionId, actionTrace ? JSON.stringify(actionTrace) : null]
    );
    
    if (embeddingVector) {
        // Insert into vector table using Float32Array buffer for sqlite-vec
        const buf = Buffer.from(new Float32Array(embeddingVector).buffer);
        run(
            `INSERT INTO frontend_rag_vec (id, embedding) VALUES (?, ?)`,
            [BigInt(lastInsertRowid), buf]
        );
    }
    
    return lastInsertRowid;
}

export async function searchRag(queryVector, limit = 5, minConfidence = 0.7, paradigm = null) {
    await getDb();
    
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
    queryParams.push(limit);

    const rows = query(querySql, queryParams);

    return rows.map(r => ({
        id: r.id,
        type: r.type,
        content: r.content,
        metadata: JSON.parse(r.metadata),
        version_id: r.version_id,
        status: r.status,
        confidence: parseFloat(r.score.toFixed(2))
    }));
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


