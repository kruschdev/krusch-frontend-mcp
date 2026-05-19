/**
 * @module tailwind
 * CSS → Tailwind class mapping. Uses the `css` package for AST parsing
 * and a static dictionary (~230 entries) for class resolution.
 *
 * Shorthand properties (margin, padding) are expanded into directional
 * components via the `expandShorthand` helper before dictionary lookup.
 */

const tailwindMap = {
    // ── Layout ───────────────────────────────────────────────────────────────
    'display: flex;': 'flex',
    'display: grid;': 'grid',
    'display: block;': 'block',
    'display: inline;': 'inline',
    'display: inline-block;': 'inline-block',
    'display: inline-flex;': 'inline-flex',
    'display: inline-grid;': 'inline-grid',
    'display: none;': 'hidden',
    'display: contents;': 'contents',

    // ── Flexbox ──────────────────────────────────────────────────────────────
    'flex-direction: column;': 'flex-col',
    'flex-direction: column-reverse;': 'flex-col-reverse',
    'flex-direction: row;': 'flex-row',
    'flex-direction: row-reverse;': 'flex-row-reverse',
    'flex-wrap: wrap;': 'flex-wrap',
    'flex-wrap: nowrap;': 'flex-nowrap',
    'flex-wrap: wrap-reverse;': 'flex-wrap-reverse',
    'flex: 1 1 0%;': 'flex-1',
    'flex: 1 1 auto;': 'flex-auto',
    'flex: 0 1 auto;': 'flex-initial',
    'flex: none;': 'flex-none',
    'flex-grow: 1;': 'grow',
    'flex-grow: 0;': 'grow-0',
    'flex-shrink: 1;': 'shrink',
    'flex-shrink: 0;': 'shrink-0',

    // ── Grid ─────────────────────────────────────────────────────────────────
    'grid-template-columns: repeat(1, minmax(0, 1fr));': 'grid-cols-1',
    'grid-template-columns: repeat(2, minmax(0, 1fr));': 'grid-cols-2',
    'grid-template-columns: repeat(3, minmax(0, 1fr));': 'grid-cols-3',
    'grid-template-columns: repeat(4, minmax(0, 1fr));': 'grid-cols-4',
    'grid-template-columns: repeat(6, minmax(0, 1fr));': 'grid-cols-6',
    'grid-template-columns: repeat(12, minmax(0, 1fr));': 'grid-cols-12',

    // ── Alignment ────────────────────────────────────────────────────────────
    'justify-content: center;': 'justify-center',
    'justify-content: flex-start;': 'justify-start',
    'justify-content: flex-end;': 'justify-end',
    'justify-content: space-between;': 'justify-between',
    'justify-content: space-around;': 'justify-around',
    'justify-content: space-evenly;': 'justify-evenly',
    'align-items: center;': 'items-center',
    'align-items: flex-start;': 'items-start',
    'align-items: flex-end;': 'items-end',
    'align-items: stretch;': 'items-stretch',
    'align-items: baseline;': 'items-baseline',
    'align-self: auto;': 'self-auto',
    'align-self: center;': 'self-center',
    'align-self: flex-start;': 'self-start',
    'align-self: flex-end;': 'self-end',
    'align-self: stretch;': 'self-stretch',
    'place-items: center;': 'place-items-center',
    'place-content: center;': 'place-content-center',

    // ── Spacing — Padding ────────────────────────────────────────────────────
    'padding: 0;': 'p-0',
    'padding: 0.25rem;': 'p-1',
    'padding: 0.5rem;': 'p-2',
    'padding: 0.75rem;': 'p-3',
    'padding: 1rem;': 'p-4',
    'padding: 1.25rem;': 'p-5',
    'padding: 1.5rem;': 'p-6',
    'padding: 2rem;': 'p-8',
    'padding: 2.5rem;': 'p-10',
    'padding: 3rem;': 'p-12',
    'padding: 4rem;': 'p-16',
    'padding-left: 0;': 'pl-0',
    'padding-left: 0.5rem;': 'pl-2',
    'padding-left: 1rem;': 'pl-4',
    'padding-left: 1.5rem;': 'pl-6',
    'padding-left: 2rem;': 'pl-8',
    'padding-right: 0;': 'pr-0',
    'padding-right: 0.5rem;': 'pr-2',
    'padding-right: 1rem;': 'pr-4',
    'padding-right: 1.5rem;': 'pr-6',
    'padding-right: 2rem;': 'pr-8',
    'padding-top: 0;': 'pt-0',
    'padding-top: 0.5rem;': 'pt-2',
    'padding-top: 1rem;': 'pt-4',
    'padding-top: 1.5rem;': 'pt-6',
    'padding-top: 2rem;': 'pt-8',
    'padding-bottom: 0;': 'pb-0',
    'padding-bottom: 0.5rem;': 'pb-2',
    'padding-bottom: 1rem;': 'pb-4',
    'padding-bottom: 1.5rem;': 'pb-6',
    'padding-bottom: 2rem;': 'pb-8',

    // ── Spacing — Margin ─────────────────────────────────────────────────────
    'margin: 0;': 'm-0',
    'margin: auto;': 'm-auto',
    'margin: 0.25rem;': 'm-1',
    'margin: 0.5rem;': 'm-2',
    'margin: 0.75rem;': 'm-3',
    'margin: 1rem;': 'm-4',
    'margin: 1.25rem;': 'm-5',
    'margin: 1.5rem;': 'm-6',
    'margin: 2rem;': 'm-8',
    'margin: 2.5rem;': 'm-10',
    'margin: 3rem;': 'm-12',
    'margin: 4rem;': 'm-16',
    'margin-left: auto;': 'ml-auto',
    'margin-left: 0;': 'ml-0',
    'margin-left: 0.5rem;': 'ml-2',
    'margin-left: 1rem;': 'ml-4',
    'margin-left: 1.5rem;': 'ml-6',
    'margin-left: 2rem;': 'ml-8',
    'margin-right: auto;': 'mr-auto',
    'margin-right: 0;': 'mr-0',
    'margin-right: 0.5rem;': 'mr-2',
    'margin-right: 1rem;': 'mr-4',
    'margin-right: 1.5rem;': 'mr-6',
    'margin-right: 2rem;': 'mr-8',
    'margin-top: 0;': 'mt-0',
    'margin-top: 0.5rem;': 'mt-2',
    'margin-top: 1rem;': 'mt-4',
    'margin-top: 1.5rem;': 'mt-6',
    'margin-top: 2rem;': 'mt-8',
    'margin-bottom: 0;': 'mb-0',
    'margin-bottom: 0.5rem;': 'mb-2',
    'margin-bottom: 1rem;': 'mb-4',
    'margin-bottom: 1.5rem;': 'mb-6',
    'margin-bottom: 2rem;': 'mb-8',

    // ── Gap ──────────────────────────────────────────────────────────────────
    'gap: 0;': 'gap-0',
    'gap: 0.25rem;': 'gap-1',
    'gap: 0.5rem;': 'gap-2',
    'gap: 0.75rem;': 'gap-3',
    'gap: 1rem;': 'gap-4',
    'gap: 1.5rem;': 'gap-6',
    'gap: 2rem;': 'gap-8',

    // ── Width ────────────────────────────────────────────────────────────────
    'width: 100%;': 'w-full',
    'width: auto;': 'w-auto',
    'width: 50%;': 'w-1/2',
    'width: 33.333333%;': 'w-1/3',
    'width: 25%;': 'w-1/4',
    'width: 100vw;': 'w-screen',
    'width: fit-content;': 'w-fit',
    'width: min-content;': 'w-min',
    'width: max-content;': 'w-max',
    'min-width: 100%;': 'min-w-full',
    'min-width: 0;': 'min-w-0',
    'max-width: 100%;': 'max-w-full',
    'max-width: none;': 'max-w-none',
    'max-width: 28rem;': 'max-w-md',
    'max-width: 32rem;': 'max-w-lg',
    'max-width: 36rem;': 'max-w-xl',
    'max-width: 42rem;': 'max-w-2xl',
    'max-width: 48rem;': 'max-w-3xl',
    'max-width: 56rem;': 'max-w-4xl',
    'max-width: 64rem;': 'max-w-5xl',
    'max-width: 72rem;': 'max-w-6xl',
    'max-width: 80rem;': 'max-w-7xl',

    // ── Height ───────────────────────────────────────────────────────────────
    'height: 100%;': 'h-full',
    'height: auto;': 'h-auto',
    'height: 100vh;': 'h-screen',
    'height: 100dvh;': 'h-dvh',
    'height: fit-content;': 'h-fit',
    'min-height: 100%;': 'min-h-full',
    'min-height: 100vh;': 'min-h-screen',

    // ── Typography ───────────────────────────────────────────────────────────
    'font-weight: 100;': 'font-thin',
    'font-weight: 200;': 'font-extralight',
    'font-weight: 300;': 'font-light',
    'font-weight: 400;': 'font-normal',
    'font-weight: 500;': 'font-medium',
    'font-weight: 600;': 'font-semibold',
    'font-weight: 700;': 'font-bold',
    'font-weight: bold;': 'font-bold',
    'font-weight: 800;': 'font-extrabold',
    'font-weight: 900;': 'font-black',
    'font-style: italic;': 'italic',
    'font-style: normal;': 'not-italic',
    'text-align: left;': 'text-left',
    'text-align: center;': 'text-center',
    'text-align: right;': 'text-right',
    'text-align: justify;': 'text-justify',
    'text-decoration-line: underline;': 'underline',
    'text-decoration-line: line-through;': 'line-through',
    'text-decoration-line: none;': 'no-underline',
    'text-transform: uppercase;': 'uppercase',
    'text-transform: lowercase;': 'lowercase',
    'text-transform: capitalize;': 'capitalize',
    'text-transform: none;': 'normal-case',
    'font-size: 0.75rem;': 'text-xs',
    'font-size: 0.875rem;': 'text-sm',
    'font-size: 1rem;': 'text-base',
    'font-size: 1.125rem;': 'text-lg',
    'font-size: 1.25rem;': 'text-xl',
    'font-size: 1.5rem;': 'text-2xl',
    'font-size: 1.875rem;': 'text-3xl',
    'font-size: 2.25rem;': 'text-4xl',
    'font-size: 3rem;': 'text-5xl',
    'line-height: 1;': 'leading-none',
    'line-height: 1.25;': 'leading-tight',
    'line-height: 1.5;': 'leading-normal',
    'line-height: 1.75;': 'leading-relaxed',
    'line-height: 2;': 'leading-loose',
    'letter-spacing: -0.05em;': 'tracking-tighter',
    'letter-spacing: -0.025em;': 'tracking-tight',
    'letter-spacing: 0;': 'tracking-normal',
    'letter-spacing: 0.025em;': 'tracking-wide',
    'letter-spacing: 0.05em;': 'tracking-wider',
    'letter-spacing: 0.1em;': 'tracking-widest',
    'white-space: nowrap;': 'whitespace-nowrap',
    'white-space: pre;': 'whitespace-pre',
    'white-space: normal;': 'whitespace-normal',
    'word-break: break-all;': 'break-all',
    'overflow-wrap: break-word;': 'break-words',

    // ── Borders ──────────────────────────────────────────────────────────────
    'border-radius: 0;': 'rounded-none',
    'border-radius: 0.125rem;': 'rounded-sm',
    'border-radius: 0.25rem;': 'rounded',
    'border-radius: 0.375rem;': 'rounded-md',
    'border-radius: 0.5rem;': 'rounded-lg',
    'border-radius: 0.75rem;': 'rounded-xl',
    'border-radius: 1rem;': 'rounded-2xl',
    'border-radius: 1.5rem;': 'rounded-3xl',
    'border-radius: 9999px;': 'rounded-full',
    'border-width: 0;': 'border-0',
    'border-width: 1px;': 'border',
    'border-width: 2px;': 'border-2',
    'border-width: 4px;': 'border-4',
    'border-width: 8px;': 'border-8',
    'border-style: solid;': 'border-solid',
    'border-style: dashed;': 'border-dashed',
    'border-style: dotted;': 'border-dotted',
    'border-style: none;': 'border-none',

    // ── Background & Effects ─────────────────────────────────────────────────
    'background-color: transparent;': 'bg-transparent',
    'background-color: currentColor;': 'bg-current',
    'opacity: 0;': 'opacity-0',
    'opacity: 0.25;': 'opacity-25',
    'opacity: 0.5;': 'opacity-50',
    'opacity: 0.75;': 'opacity-75',
    'opacity: 1;': 'opacity-100',

    // ── Positioning ──────────────────────────────────────────────────────────
    'position: static;': 'static',
    'position: relative;': 'relative',
    'position: absolute;': 'absolute',
    'position: fixed;': 'fixed',
    'position: sticky;': 'sticky',
    'top: 0;': 'top-0',
    'right: 0;': 'right-0',
    'bottom: 0;': 'bottom-0',
    'left: 0;': 'left-0',
    'inset: 0;': 'inset-0',
    'z-index: 0;': 'z-0',
    'z-index: 10;': 'z-10',
    'z-index: 20;': 'z-20',
    'z-index: 30;': 'z-30',
    'z-index: 40;': 'z-40',
    'z-index: 50;': 'z-50',
    'z-index: auto;': 'z-auto',

    // ── Overflow ──────────────────────────────────────────────────────────────
    'overflow: auto;': 'overflow-auto',
    'overflow: hidden;': 'overflow-hidden',
    'overflow: visible;': 'overflow-visible',
    'overflow: scroll;': 'overflow-scroll',
    'overflow-x: auto;': 'overflow-x-auto',
    'overflow-y: auto;': 'overflow-y-auto',
    'overflow-x: hidden;': 'overflow-x-hidden',
    'overflow-y: hidden;': 'overflow-y-hidden',

    // ── Cursor & Interaction ─────────────────────────────────────────────────
    'cursor: pointer;': 'cursor-pointer',
    'cursor: default;': 'cursor-default',
    'cursor: not-allowed;': 'cursor-not-allowed',
    'cursor: wait;': 'cursor-wait',
    'cursor: grab;': 'cursor-grab',
    'pointer-events: none;': 'pointer-events-none',
    'pointer-events: auto;': 'pointer-events-auto',
    'user-select: none;': 'select-none',
    'user-select: text;': 'select-text',
    'user-select: all;': 'select-all',

    // ── Box Model ────────────────────────────────────────────────────────────
    'box-sizing: border-box;': 'box-border',
    'box-sizing: content-box;': 'box-content',

    // ── Transitions ──────────────────────────────────────────────────────────
    'transition-property: all;': 'transition-all',
    'transition-property: none;': 'transition-none',
    'transition-duration: 150ms;': 'duration-150',
    'transition-duration: 200ms;': 'duration-200',
    'transition-duration: 300ms;': 'duration-300',
    'transition-duration: 500ms;': 'duration-500',
    'transition-timing-function: ease-in-out;': 'ease-in-out',
    'transition-timing-function: ease-in;': 'ease-in',
    'transition-timing-function: ease-out;': 'ease-out',
    'transition-timing-function: linear;': 'ease-linear',

    // ── Object Fit ───────────────────────────────────────────────────────────
    'object-fit: contain;': 'object-contain',
    'object-fit: cover;': 'object-cover',
    'object-fit: fill;': 'object-fill',
    'object-fit: none;': 'object-none',
    'object-fit: scale-down;': 'object-scale-down',

    // ── Aspect Ratio ─────────────────────────────────────────────────────────
    'aspect-ratio: auto;': 'aspect-auto',
    'aspect-ratio: 1 / 1;': 'aspect-square',
    'aspect-ratio: 16 / 9;': 'aspect-video',
};

import css from 'css';

/**
 * Expands CSS shorthand properties (margin, padding) into their directional components.
 * @param {string} property 
 * @param {string} value 
 * @returns {Array<{property: string, value: string}>}
 */
function expandShorthand(property, value) {
    const parts = value.split(/\s+/);
    if (parts.length === 1) return [{ property, value }];

    if (property === 'margin' || property === 'padding') {
        let t, r, b, l;
        if (parts.length === 2) {
            t = b = parts[0];
            r = l = parts[1];
        } else if (parts.length === 3) {
            t = parts[0];
            r = l = parts[1];
            b = parts[2];
        } else if (parts.length === 4) {
            t = parts[0];
            r = parts[1];
            b = parts[2];
            l = parts[3];
        } else {
            return [{ property, value }];
        }
        return [
            { property: `${property}-top`, value: t },
            { property: `${property}-right`, value: r },
            { property: `${property}-bottom`, value: b },
            { property: `${property}-left`, value: l }
        ];
    }

    return [{ property, value }];
}

/**
 * Translate CSS declarations to Tailwind utility classes.
 * @param {string} cssString - Raw CSS declarations (e.g. 'display: flex; padding: 1rem;')
 * @returns {{ tailwind_classes: string, unmapped_css: string[] }}
 */
export function cssToTailwind(cssString) {
    if (!cssString || cssString.trim().length === 0) {
        return { tailwind_classes: '', unmapped_css: [] };
    }

    let ast;
    try {
        ast = css.parse(`* { ${cssString} }`);
    } catch (e) {
        // If it fails to parse, fallback to empty array
        return { tailwind_classes: '', unmapped_css: [cssString] };
    }

    const declarations = ast.stylesheet.rules[0]?.declarations || [];

    const classes = [];
    const unmapped = [];
    const uniqueClasses = new Set();

    for (const dec of declarations) {
        if (dec.type !== 'declaration') continue;

        const expanded = expandShorthand(dec.property, dec.value);

        for (const { property, value } of expanded) {
            const decString = `${property}: ${value};`;
            const matchedClass = tailwindMap[decString];
            
            if (matchedClass) {
                if (!uniqueClasses.has(matchedClass)) {
                    classes.push(matchedClass);
                    uniqueClasses.add(matchedClass);
                }
            } else {
                unmapped.push(decString);
            }
        }
    }

    return {
        tailwind_classes: classes.join(' '),
        unmapped_css: unmapped
    };
}
