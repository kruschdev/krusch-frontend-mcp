import test from 'node:test';
import assert from 'node:assert';
import { generateColorPalette } from '../src/tools/color.js';

test('generateColorPalette calculates correct contrast and palette', () => {
    // Blue
    const result = generateColorPalette('#3B82F6');
    assert.strictEqual(result.base, '#3B82F6');
    assert.ok(result.complementary);
    assert.strictEqual(result.analogous.length, 2);
    assert.strictEqual(result.triadic.length, 2);
    
    // Check contrast ratio calculation logic
    assert.ok(result.accessibility.contrast_ratio > 0);
    assert.ok(['AAA', 'AA', 'FAIL'].includes(result.accessibility.wcag_level));
});

test('generateColorPalette throws on invalid hex', () => {
    assert.throws(() => generateColorPalette('invalid'), /Invalid hex code/);
});
