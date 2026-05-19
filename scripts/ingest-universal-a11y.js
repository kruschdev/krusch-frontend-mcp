/**
 * @module ingest-universal-a11y
 * Seeds the krusch-frontend-mcp RAG store with Universal accessibility (WCAG/ARIA) heuristics.
 * Run: node scripts/ingest-universal-a11y.js
 */
import { seedRules } from './seed-utils.js';

const RULES = [
    {
        content: 'Modals and dialogs must trap keyboard focus. When a modal is open, pressing Tab should cycle through focusable elements inside the modal, never escaping to the background.',
        metadata: { category: 'accessibility', paradigm: 'universal', priority: 'critical' }
    },
    {
        content: 'Custom comboboxes must use the correct ARIA structure: role="combobox" on the input, aria-controls pointing to a role="listbox", and aria-activedescendant managing the active option.',
        metadata: { category: 'accessibility', paradigm: 'universal', priority: 'critical' }
    },
    {
        content: 'Avoid using color combinations that are problematic for color blindness (Deuteranomaly/Protanomaly). Never rely purely on red and green to indicate status without supporting icons or text.',
        metadata: { category: 'accessibility', paradigm: 'universal', priority: 'high' }
    },
    {
        content: 'Interactive elements must not only have a 44x44 CSS pixel touch target, but there must be adequate spacing (at least 8px) between adjacent touch targets to prevent accidental taps.',
        metadata: { category: 'accessibility', paradigm: 'universal', priority: 'high' }
    },
    {
        content: 'Use aria-live regions (polite or assertive) to announce dynamic content changes (like toast notifications or form validation errors) to screen readers without shifting focus.',
        metadata: { category: 'accessibility', paradigm: 'universal', priority: 'high' }
    },
    {
        content: 'Accordion components must have buttons that control the expand/collapse state with aria-expanded="true/false", and the button should aria-controls the content panel ID.',
        metadata: { category: 'accessibility', paradigm: 'universal', priority: 'critical' }
    }
];

seedRules(RULES, 'Universal Accessibility').catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
});
