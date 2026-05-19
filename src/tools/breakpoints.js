/**
 * @module breakpoints
 * Deterministic generation of responsive media queries.
 */

const DEFAULT_BREAKPOINTS = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
};

/**
 * Generate CSS media queries for responsive breakpoints.
 * Merges custom breakpoint widths with the default set (sm–2xl).
 * @param {Record<string, string>} customBreakpoints - Optional width overrides keyed by breakpoint name.
 * @returns {{ css: string, breakpoints: Record<string, string> }}
 */
export function generateResponsiveBreakpoints(customBreakpoints = {}) {
    const breakpoints = { ...DEFAULT_BREAKPOINTS, ...customBreakpoints };
    let css = `/* Responsive Breakpoints */\n`;
    for (const [name, width] of Object.entries(breakpoints)) {
        css += `\n/* ${name}: ${width} */\n@media (min-width: ${width}) {\n  :root {\n    --current-breakpoint: '${name}';\n  }\n}\n`;
    }
    return {
        css: css,
        breakpoints: breakpoints
    };
}
