import test from 'node:test';
import assert from 'node:assert';
import { getCanonicalTemplate, listCanonicalTemplates, CANONICAL_TEMPLATES } from '../src/tools/canonical-templates.js';

test('getCanonicalTemplate returns article-shell with cyber-grid and deadbolt footer', () => {
  const tpl = getCanonicalTemplate('article-shell');
  assert.strictEqual(tpl.key, 'article-shell');
  assert.ok(tpl.html.includes('class="cyber-grid"'));
  assert.ok(tpl.html.includes('class="nav-back"'));
  assert.ok(tpl.html.includes('class="main-footer"'));
  assert.ok(tpl.html.includes('class="dead-bolt"'));
  assert.ok(tpl.html.includes('68,2 26,26'));
});

test('getCanonicalTemplate returns footer-deadbolt with 13-point polygon', () => {
  const tpl = getCanonicalTemplate('footer-deadbolt');
  assert.strictEqual(tpl.key, 'footer-deadbolt');
  assert.ok(tpl.html.includes('KRUSCH<span style="color: var(--accent-cyan);">.DEV</span>'));
  assert.ok(tpl.html.includes('polygon points='));
});

test('getCanonicalTemplate throws on unknown template', () => {
  assert.throws(() => {
    getCanonicalTemplate('nonexistent-template');
  }, /Unknown template/);
});

import { FRONTEND_TOOL_DEFINITIONS } from '../src/index.js';

test('listCanonicalTemplates returns all available keys', () => {
  const list = listCanonicalTemplates();
  assert.ok(list.length >= 5);
  const keys = list.map(item => item.key);
  assert.ok(keys.includes('article-shell'));
  assert.ok(keys.includes('footer-deadbolt'));
  assert.ok(keys.includes('deadbolt-svg'));
});

test('MCP Server: all 12 tools declare explicit boolean behavioral annotations', () => {
  assert.strictEqual(FRONTEND_TOOL_DEFINITIONS.length, 12);
  const requiredHints = ['readOnlyHint', 'destructiveHint', 'idempotentHint', 'openWorldHint'];
  for (const tool of FRONTEND_TOOL_DEFINITIONS) {
    assert.ok(tool.annotations, `Tool ${tool.name} must define annotations`);
    for (const hint of requiredHints) {
      assert.strictEqual(typeof tool.annotations[hint], 'boolean', `Tool ${tool.name} hint ${hint} must be boolean`);
    }
  }
});
