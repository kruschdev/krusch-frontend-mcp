import test from 'node:test';
import assert from 'node:assert';
import { cssToTailwind } from '../src/tools/tailwind.js';

test('cssToTailwind maps basic layout declarations', () => {
    const result = cssToTailwind('display: flex; justify-content: center; align-items: center;');
    assert.strictEqual(result.tailwind_classes, 'flex justify-center items-center');
    assert.strictEqual(result.unmapped_css.length, 0);
});

test('cssToTailwind maps spacing declarations', () => {
    const result = cssToTailwind('padding: 1rem; margin: 0.5rem; gap: 1rem;');
    assert.strictEqual(result.tailwind_classes, 'p-4 m-2 gap-4');
    assert.strictEqual(result.unmapped_css.length, 0);
});

test('cssToTailwind maps typography declarations', () => {
    const result = cssToTailwind('font-weight: bold; text-align: center; font-size: 1.5rem; text-transform: uppercase;');
    assert.strictEqual(result.tailwind_classes, 'font-bold text-center text-2xl uppercase');
    assert.strictEqual(result.unmapped_css.length, 0);
});

test('cssToTailwind maps positioning declarations', () => {
    const result = cssToTailwind('position: absolute; top: 0; left: 0; z-index: 50;');
    assert.strictEqual(result.tailwind_classes, 'absolute top-0 left-0 z-50');
    assert.strictEqual(result.unmapped_css.length, 0);
});

test('cssToTailwind maps sizing declarations', () => {
    const result = cssToTailwind('width: 100%; height: 100vh; max-width: 42rem;');
    assert.strictEqual(result.tailwind_classes, 'w-full h-screen max-w-2xl');
    assert.strictEqual(result.unmapped_css.length, 0);
});

test('cssToTailwind maps border declarations', () => {
    const result = cssToTailwind('border-radius: 0.5rem; border-width: 1px; border-style: solid;');
    assert.strictEqual(result.tailwind_classes, 'rounded-lg border border-solid');
    assert.strictEqual(result.unmapped_css.length, 0);
});

test('cssToTailwind reports unmapped CSS', () => {
    const result = cssToTailwind('display: flex; color: red; background: linear-gradient(to right, #000, #fff);');
    assert.strictEqual(result.tailwind_classes, 'flex');
    assert.strictEqual(result.unmapped_css.length, 2);
    assert.ok(result.unmapped_css.includes('color: red;'));
});

test('cssToTailwind maps transitions and effects', () => {
    const result = cssToTailwind('transition-property: all; transition-duration: 300ms; opacity: 0.5;');
    assert.strictEqual(result.tailwind_classes, 'transition-all duration-300 opacity-50');
    assert.strictEqual(result.unmapped_css.length, 0);
});

test('cssToTailwind handles empty input', () => {
    const result = cssToTailwind('');
    assert.strictEqual(result.tailwind_classes, '');
    assert.strictEqual(result.unmapped_css.length, 0);
});

test('cssToTailwind maps cursor and interaction', () => {
    const result = cssToTailwind('cursor: pointer; user-select: none; pointer-events: none;');
    assert.strictEqual(result.tailwind_classes, 'cursor-pointer select-none pointer-events-none');
    assert.strictEqual(result.unmapped_css.length, 0);
});

test('cssToTailwind expands margin shorthand', () => {
    const result = cssToTailwind('margin: 1rem 2rem;');
    assert.strictEqual(result.tailwind_classes, 'mt-4 mr-8 mb-4 ml-8');
    assert.strictEqual(result.unmapped_css.length, 0);
});

test('cssToTailwind expands padding shorthand with 3 values', () => {
    const result = cssToTailwind('padding: 1rem 0.5rem 2rem;');
    assert.strictEqual(result.tailwind_classes, 'pt-4 pr-2 pb-8 pl-2');
    assert.strictEqual(result.unmapped_css.length, 0);
});

test('cssToTailwind expands padding shorthand with 4 values', () => {
    const result = cssToTailwind('padding: 0.5rem 1rem 1.5rem 2rem;');
    assert.strictEqual(result.tailwind_classes, 'pt-2 pr-4 pb-6 pl-8');
    assert.strictEqual(result.unmapped_css.length, 0);
});

test('cssToTailwind normalizes uppercase properties/values, multi-space shorthands, !important, and non-string input (REF14-02)', () => {
    assert.deepStrictEqual(cssToTailwind(null), { tailwind_classes: '', unmapped_css: [] });
    assert.deepStrictEqual(cssToTailwind(42), { tailwind_classes: '', unmapped_css: [] });

    const upper = cssToTailwind('DISPLAY: FLEX; PADDING: 1REM   2REM !IMPORTANT; BACKGROUND-COLOR: CURRENTCOLOR;');
    assert.strictEqual(upper.tailwind_classes, 'flex pt-4 pr-8 pb-4 pl-8 bg-current');
    assert.strictEqual(upper.unmapped_css.length, 0);
});

