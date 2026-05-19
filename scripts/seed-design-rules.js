/**
 * @module seed-design-rules
 * Seeds the krusch-frontend-mcp RAG store with baseline design rules.
 * Run: node scripts/seed-design-rules.js
 */
import { seedRules } from './seed-utils.js';

const DESIGN_RULES = [
    // ── WCAG Accessibility ──────────────────────────────────────────────────
    {
        content: 'WCAG AA requires a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text (18px+ or 14px+ bold). WCAG AAA requires 7:1 for normal text.',
        metadata: { category: 'accessibility', standard: 'WCAG 2.1', priority: 'critical', paradigm: 'universal' }
    },
    {
        content: 'Interactive elements (buttons, links, inputs) must have a minimum touch target size of 44x44 CSS pixels per WCAG 2.5.5.',
        metadata: { category: 'accessibility', standard: 'WCAG 2.1', priority: 'critical', paradigm: 'universal' }
    },
    {
        content: 'Color must not be the only visual means of conveying information. Use icons, text labels, or patterns alongside color to indicate state (error, success, warning).',
        metadata: { category: 'accessibility', standard: 'WCAG 1.4.1', priority: 'critical', paradigm: 'universal' }
    },
    {
        content: 'Focus indicators must be visible on all interactive elements. Use outline with at least 2px width and sufficient contrast. Never use outline: none without a custom alternative.',
        metadata: { category: 'accessibility', standard: 'WCAG 2.4.7', priority: 'critical', paradigm: 'universal' }
    },
    {
        content: 'All images must have alt text. Decorative images should use alt="" and aria-hidden="true". Informative images need descriptive alt text.',
        metadata: { category: 'accessibility', standard: 'WCAG 1.1.1', priority: 'critical', paradigm: 'universal' }
    },

    // ── Spacing Scale ───────────────────────────────────────────────────────
    {
        content: 'Use a consistent spacing scale based on 4px (0.25rem) increments: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px. Avoid arbitrary pixel values.',
        metadata: { category: 'spacing', system: '4px grid', priority: 'high', paradigm: 'universal' }
    },
    {
        content: 'Component internal padding should follow the pattern: compact (8px), default (16px), spacious (24px). Card padding is typically 16px-24px.',
        metadata: { category: 'spacing', system: 'component', priority: 'high', paradigm: 'universal' }
    },
    {
        content: 'Section spacing between major content blocks should be 48px-96px. Use consistent vertical rhythm — the baseline grid should be a multiple of 8px.',
        metadata: { category: 'spacing', system: 'layout', priority: 'medium', paradigm: 'universal' }
    },
    {
        content: 'Gap between flex/grid children should follow the spacing scale. Common patterns: tight (4-8px), normal (12-16px), loose (24-32px).',
        metadata: { category: 'spacing', system: 'layout', priority: 'medium', paradigm: 'universal' }
    },

    // ── Typography ──────────────────────────────────────────────────────────
    {
        content: 'Use a typographic scale with consistent ratios. Recommended: 12px, 14px, 16px (base), 18px, 20px, 24px, 30px, 36px, 48px, 60px, 72px. The base font size should be 16px (1rem).',
        metadata: { category: 'typography', system: 'scale', priority: 'high', paradigm: 'universal' }
    },
    {
        content: 'Body text should use a line-height of 1.5-1.75 for readability. Headings should use 1.1-1.3. Never go below 1.2 for any readable text.',
        metadata: { category: 'typography', system: 'readability', priority: 'high', paradigm: 'universal' }
    },
    {
        content: 'Limit the number of font families to 2 maximum: one for headings, one for body. Use system font stacks or Google Fonts (Inter, Outfit, Roboto) for performance.',
        metadata: { category: 'typography', system: 'fonts', priority: 'high', paradigm: 'universal' }
    },
    {
        content: 'Optimal line length for readability is 50-75 characters per line (approximately 45-65ch). Use max-width: 65ch for text containers.',
        metadata: { category: 'typography', system: 'readability', priority: 'medium', paradigm: 'universal' }
    },
    {
        content: 'Use font-weight 400 (regular) for body, 500 (medium) for emphasis, 600-700 (semibold/bold) for headings. Avoid weight 300 (light) for body text on screens.',
        metadata: { category: 'typography', system: 'weight', priority: 'medium', paradigm: 'universal' }
    },

    // ── Color System ────────────────────────────────────────────────────────
    {
        content: 'Design systems should define semantic color tokens: primary, secondary, accent, background, surface, error, warning, success, info. Each needs light and dark variants.',
        metadata: { category: 'color', system: 'tokens', priority: 'high', paradigm: 'universal' }
    },
    {
        content: 'Dark mode surfaces should use neutral grays (not pure black). Recommended: background #0a0a0a-#121212, surface #1a1a1a-#1e1e1e, elevated #2a2a2a-#2d2d2d.',
        metadata: { category: 'color', system: 'dark-mode', priority: 'high', paradigm: 'universal' }
    },
    {
        content: 'Avoid using pure colors (#ff0000, #00ff00, #0000ff). Instead, use curated palette colors with adjusted saturation and lightness. HSL notation makes this easier.',
        metadata: { category: 'color', system: 'palette', priority: 'medium', paradigm: 'universal' }
    },
    {
        content: 'Glassmorphism requires: background rgba with low alpha (0.1-0.3), backdrop-filter: blur(10-20px), subtle border (1px solid rgba(255,255,255,0.2)), and box-shadow for depth.',
        metadata: { category: 'color', system: 'effects', priority: 'medium', paradigm: 'universal' }
    },

    // ── Layout Patterns ─────────────────────────────────────────────────────
    {
        content: 'Use CSS Grid for 2D layouts (cards, dashboards, galleries). Use Flexbox for 1D layouts (navbars, toolbars, stack arrangements). Grid for structure, Flex for alignment.',
        metadata: { category: 'layout', system: 'methodology', priority: 'high', paradigm: 'universal' }
    },
    {
        content: 'Mobile-first responsive design: start with the mobile layout, then add complexity via min-width media queries. Breakpoints: sm(640px), md(768px), lg(1024px), xl(1280px), 2xl(1536px).',
        metadata: { category: 'layout', system: 'responsive', priority: 'high', paradigm: 'universal' }
    },
    {
        content: 'Container queries (@container) should be preferred over media queries for component-level responsiveness. Use container-type: inline-size on parent elements.',
        metadata: { category: 'layout', system: 'responsive', priority: 'medium', paradigm: 'universal' }
    },
    {
        content: 'Card components should use: border-radius 8-16px, padding 16-24px, subtle box-shadow (0 1px 3px rgba(0,0,0,0.1)), and consistent spacing between cards (16-24px gap).',
        metadata: { category: 'layout', system: 'components', priority: 'medium', paradigm: 'universal' }
    },

    // ── Animation & Interaction ─────────────────────────────────────────────
    {
        content: 'Use transition durations: instant (0-100ms) for toggles, fast (150-200ms) for hover/focus, medium (250-350ms) for enter/exit, slow (400-500ms) for page transitions. Never exceed 700ms.',
        metadata: { category: 'animation', system: 'timing', priority: 'high', paradigm: 'universal' }
    },
    {
        content: 'Prefer ease-out for enter animations, ease-in for exit animations, and ease-in-out for state changes. Use cubic-bezier(0.4, 0, 0.2, 1) as a versatile default.',
        metadata: { category: 'animation', system: 'easing', priority: 'medium', paradigm: 'universal' }
    },
    {
        content: 'Respect prefers-reduced-motion: reduce — disable animations and transitions for users who request it. Use @media (prefers-reduced-motion: reduce) { * { animation: none; transition: none; } }.',
        metadata: { category: 'animation', standard: 'WCAG 2.3.3', priority: 'critical', paradigm: 'universal' }
    },

    // ── Button Patterns ─────────────────────────────────────────────────────
    {
        content: 'Primary buttons: 16px horizontal padding, 8px-12px vertical padding, border-radius 6-8px, font-weight 500-600. Minimum width 80px. Use the primary brand color.',
        metadata: { category: 'components', system: 'buttons', priority: 'high', paradigm: 'universal' }
    },
    {
        content: 'Button hierarchy: Primary (filled, high contrast), Secondary (outlined or muted fill), Ghost/Tertiary (text-only, no fill). Destructive actions use red/danger color.',
        metadata: { category: 'components', system: 'buttons', priority: 'high', paradigm: 'universal' }
    },

    // ── Form Patterns ───────────────────────────────────────────────────────
    {
        content: 'Input fields should have: min-height 40-44px, padding 8-12px horizontal, border 1px solid with muted color, border-radius 6-8px, and clear focus ring (2px solid primary).',
        metadata: { category: 'components', system: 'forms', priority: 'high', paradigm: 'universal' }
    },
    {
        content: 'Form labels should be positioned above inputs (not inline) for better scanning. Use font-size 14px, font-weight 500, and 4-8px margin-bottom between label and input.',
        metadata: { category: 'components', system: 'forms', priority: 'medium', paradigm: 'universal' }
    },
];

seedRules(DESIGN_RULES, 'baseline design', true).catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
});
