import test from 'node:test';
import assert from 'node:assert';
import { generateCssVariables } from '../src/tools/figma.js';

test('generateCssVariables creates valid :root block from flat tokens', () => {
    const tokens = {
        colors: {
            primary: { value: '#3B82F6', type: 'color' },
            secondary: { value: '#6366F1', type: 'color' }
        }
    };
    const result = generateCssVariables(JSON.stringify(tokens));
    assert.ok(result.startsWith(':root {'));
    assert.ok(result.includes('--colors-primary: #3B82F6;'));
    assert.ok(result.includes('--colors-secondary: #6366F1;'));
    assert.ok(result.endsWith('}'));
});

test('generateCssVariables handles deeply nested tokens', () => {
    const tokens = {
        global: {
            spacing: {
                small: { value: '8px', type: 'spacing' }
            }
        }
    };
    const result = generateCssVariables(JSON.stringify(tokens));
    assert.ok(result.includes('--global-spacing-small: 8px;'));
});

test('generateCssVariables converts camelCase keys to kebab-case', () => {
    const tokens = {
        fontSize: {
            bodyLarge: { value: '18px', type: 'fontSizes' }
        }
    };
    const result = generateCssVariables(JSON.stringify(tokens));
    assert.ok(result.includes('font-size'));
    assert.ok(result.includes('body-large'));
});

test('generateCssVariables throws on invalid JSON', () => {
    assert.throws(() => generateCssVariables('not json'), /Invalid JSON tokens/);
});

test('generateCssVariables handles empty tokens object', () => {
    const result = generateCssVariables(JSON.stringify({}));
    assert.strictEqual(result, ':root {\n\n}');
});
