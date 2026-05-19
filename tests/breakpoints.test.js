import test from 'node:test';
import assert from 'node:assert';
import { generateResponsiveBreakpoints } from '../src/tools/breakpoints.js';

test('generateResponsiveBreakpoints returns default breakpoints', () => {
    const result = generateResponsiveBreakpoints();
    assert.ok(result.css.includes('@media (min-width: 640px)'));
    assert.ok(result.css.includes('@media (min-width: 1024px)'));
    assert.strictEqual(result.breakpoints.sm, '640px');
    assert.strictEqual(result.breakpoints.md, '768px');
    assert.strictEqual(result.breakpoints.lg, '1024px');
    assert.strictEqual(result.breakpoints.xl, '1280px');
    assert.strictEqual(result.breakpoints['2xl'], '1536px');
});

test('generateResponsiveBreakpoints merges custom breakpoints', () => {
    const result = generateResponsiveBreakpoints({ '3xl': '1920px' });
    assert.strictEqual(result.breakpoints['3xl'], '1920px');
    assert.ok(result.css.includes('@media (min-width: 1920px)'));
    // Default breakpoints still present
    assert.strictEqual(result.breakpoints.sm, '640px');
});

test('generateResponsiveBreakpoints allows overriding defaults', () => {
    const result = generateResponsiveBreakpoints({ sm: '480px' });
    assert.strictEqual(result.breakpoints.sm, '480px');
    assert.ok(result.css.includes('@media (min-width: 480px)'));
});
