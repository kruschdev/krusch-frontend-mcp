/**
 * @module seed-utils
 * Shared seeding utility for RAG design rule ingestion scripts.
 * Centralizes the embed → insert loop and provides idempotent re-seeding
 * via an opt-in truncation parameter.
 */
import { addRagItem, getDb } from '../src/rag-engine.js';
import { getEmbedding } from '../src/tools/embed.js';
import { run } from '../src/lib/db.js';

/**
 * Clear all existing design rules from the RAG store.
 */
async function truncateRules() {
    await getDb();
    console.log('⚠ Clearing existing rules before re-seed...');
    run(`DELETE FROM frontend_rag WHERE type = 'design_rule'`);
    run(`DELETE FROM frontend_rag_vec WHERE id NOT IN (SELECT id FROM frontend_rag)`);
}

/**
 * Seed an array of design rules into the RAG store.
 * @param {Array<{content: string, metadata: object}>} rules - Rules to ingest.
 * @param {string} label - Human-readable label for progress logging.
 * @param {boolean} truncateFirst - If true, clear all existing design rules before inserting.
 * @returns {Promise<number>} Count of successfully seeded rules.
 */
export async function seedRules(rules, label, truncateFirst = false) {
    if (truncateFirst) await truncateRules();

    console.log(`Seeding ${rules.length} ${label} rules...`);
    let count = 0;

    for (const rule of rules) {
        try {
            const vec = await getEmbedding(rule.content);
            await addRagItem('design_rule', rule.content, rule.metadata, vec);
            count++;
            process.stderr.write(`  [${count}/${rules.length}] ${rule.metadata.category}\r`);
        } catch (e) {
            console.error(`  Failed to seed rule: ${e.message}`);
        }
    }

    console.log(`\n✓ Seeded ${count}/${rules.length} ${label} rules into RAG store.`);
    return count;
}
