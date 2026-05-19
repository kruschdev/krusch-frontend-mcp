/**
 * @module ingest-refactoring-ui
 * Seeds the krusch-frontend-mcp RAG store with Refactoring UI heuristics.
 * Run: node scripts/ingest-refactoring-ui.js
 */
import { seedRules } from './seed-utils.js';

const RULES = [
    {
        content: 'Use color and weight to create hierarchy instead of size. A smaller, heavier, darker font can draw more attention than a larger, lighter, lighter-colored font.',
        metadata: { category: 'typography', paradigm: 'refactoring-ui', priority: 'high' }
    },
    {
        content: 'De-emphasize borders. Instead of using heavy borders to separate content, use extra spacing, a subtle background color, or subtle shadows.',
        metadata: { category: 'layout', paradigm: 'refactoring-ui', priority: 'high' }
    },
    {
        content: 'Overlap elements to create depth. For example, place an avatar or an image so it overlaps the boundary between a header and the main content area.',
        metadata: { category: 'layout', paradigm: 'refactoring-ui', priority: 'medium' }
    },
    {
        content: 'Not every button needs a background color. Emphasize the primary action with a solid color, use a subtle outline for secondary actions, and ghost/text buttons for tertiary actions.',
        metadata: { category: 'components', paradigm: 'refactoring-ui', priority: 'high' }
    },
    {
        content: 'Use empty space to create logical groups. Elements that are related should be closer to each other than elements that are unrelated.',
        metadata: { category: 'spacing', paradigm: 'refactoring-ui', priority: 'high' }
    },
    {
        content: 'Avoid using pure black (#000000). For text, use dark grays like #1a202c or #2d3748 to reduce eye strain and look more professional.',
        metadata: { category: 'color', paradigm: 'refactoring-ui', priority: 'medium' }
    },
    {
        content: 'Smash icons out of alignment. Sometimes aligning an icon perfectly to the math center looks wrong visually. Align by visual weight, not bounding boxes.',
        metadata: { category: 'alignment', paradigm: 'refactoring-ui', priority: 'medium' }
    }
];

seedRules(RULES, 'Refactoring UI').catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
});
