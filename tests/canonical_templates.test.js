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
  assert.ok(tpl.html.includes('121,2 79,25'));
  assert.strictEqual(tpl.html.includes('68,2 26,26'), false);
});

test('getCanonicalTemplate returns footer-deadbolt with 13-point polygon', () => {
  const tpl = getCanonicalTemplate('footer-deadbolt');
  assert.strictEqual(tpl.key, 'footer-deadbolt');
  assert.ok(tpl.html.includes('KRUSCH<span style="color: var(--accent-cyan);">.DEV</span>'));
  assert.ok(tpl.html.includes('polygon points="121,2 79,25'));
  assert.strictEqual(tpl.html.includes('68,2 26,26'), false);
});

test('getCanonicalTemplate throws on unknown template and Object.prototype keys', () => {
  for (const badKey of ['nonexistent-template', 'toString', 'constructor', 'valueOf', '__proto__']) {
    assert.throws(() => {
      getCanonicalTemplate(badKey);
    }, /Unknown template/);
  }
});

import { FRONTEND_TOOL_DEFINITIONS, FRONTEND_TOOL_CAPABILITIES, dispatchFrontendTool } from '../src/index.js';

test('listCanonicalTemplates returns all available keys including Lego starter bricks', () => {
  const list = listCanonicalTemplates();
  assert.ok(list.length >= 10);
  const keys = list.map(item => item.key);
  assert.ok(keys.includes('article-shell'));
  assert.ok(keys.includes('footer-deadbolt'));
  assert.ok(keys.includes('deadbolt-svg'));
  for (const legoKey of ['lego-node-api', 'lego-mcp-server', 'lego-sse-route', 'lego-react-shell', 'lego-fastapi-app']) {
    assert.ok(keys.includes(legoKey), `Missing ${legoKey}`);
    const tpl = getCanonicalTemplate(legoKey);
    assert.strictEqual(tpl.key, legoKey);
    assert.ok(tpl.html.length > 40);
  }
});

test('MCP Server: all 12 tools declare explicit boolean behavioral annotations, capabilities map, and omitted-arguments safety (REF14-02)', async () => {
  assert.strictEqual(FRONTEND_TOOL_DEFINITIONS.length, 12);
  assert.strictEqual(typeof FRONTEND_TOOL_CAPABILITIES.getCanonicalTemplate, 'function');
  assert.strictEqual(typeof FRONTEND_TOOL_CAPABILITIES.listCanonicalTemplates, 'function');
  assert.strictEqual(typeof FRONTEND_TOOL_CAPABILITIES.generateColorPalette, 'function');
  assert.strictEqual(typeof FRONTEND_TOOL_CAPABILITIES.cssToTailwind, 'function');
  const requiredHints = ['readOnlyHint', 'destructiveHint', 'idempotentHint', 'openWorldHint'];
  for (const tool of FRONTEND_TOOL_DEFINITIONS) {
    assert.ok(tool.annotations, `Tool ${tool.name} must define annotations`);
    for (const hint of requiredHints) {
      assert.strictEqual(typeof tool.annotations[hint], 'boolean', `Tool ${tool.name} hint ${hint} must be boolean`);
    }
  }
  const tplTool = FRONTEND_TOOL_DEFINITIONS.find((t) => t.name === 'get_canonical_template');
  assert.ok(tplTool, 'Missing get_canonical_template tool definition');
  const enumKeys = tplTool.inputSchema.properties.templateKey.enum;
  for (const item of listCanonicalTemplates()) {
    assert.ok(enumKeys.includes(item.key), `MCP inputSchema enum missing ${item.key}`);
  }

  // Omitted or null `arguments` on zero-required-arg tools must succeed cleanly
  const bpNoArgs = await dispatchFrontendTool({ params: { name: 'generate_responsive_breakpoints' } });
  assert.notStrictEqual(bpNoArgs.isError, true);
  assert.strictEqual(JSON.parse(bpNoArgs.content[0].text).breakpoints.sm, '640px');

  const listNullArgs = await dispatchFrontendTool({ params: { name: 'list_canonical_templates', arguments: null } });
  assert.notStrictEqual(listNullArgs.isError, true);
  assert.ok(JSON.parse(listNullArgs.content[0].text).length >= 10);
});

