# krusch-frontend-mcp — Agent Guidelines & Invariants

> **Role**: Canonical Web Design & Brand Substrate MCP Server  
> **Stack**: Node 22 ESM, Stdio MCP (`@modelcontextprotocol/sdk`)  
> **Last updated**: 2026-10-30

## 1. Architectural Invariants (`MUST` / `MUST NOT`)

1. **INV-01 (Canonical Templates Over Ad-Hoc Boilerplate)**: Public web pages, articles, and starter modules must retrieve canonical templates via `get_canonical_template({ templateKey })` (`article-shell`, `footer-deadbolt`, `cyber-grid`, `deadbolt-svg`, `nav-back`, `lego-node-api`, `lego-mcp-server`, `lego-sse-route`, `lego-react-shell`, `lego-fastapi-app`, `lego-cloudflare-worker`, `lego-webhook-route`) rather than inventing ad-hoc HTML shells, SVG marks, or hand-rolled service plumbing.
2. **INV-02 (Deterministic Output)**: All template, color-palette (`generate_color_palette`), CSS-to-Tailwind (`css_to_tailwind` with arbitrary-value bracket/brace injection guards), and responsive breakpoint (`generate_responsive_breakpoints`) tools must return deterministic, side-effect-free outputs with zero external network calls.
3. **INV-03 (MCP Behavioral Annotations)**: Every registered tool must declare explicit `readOnlyHint`, `destructiveHint`, `idempotentHint`, and `openWorldHint` annotations.

## 2. Key Files & Verification
- `src/index.js`: Stdio MCP server registration and canonical template/style tool handlers.
- `src/tools/canonical-templates.js`: Authoritative 12-template registry (5 brand HTML/SVG + 7 `@krusch/toolkit` / `krusch_toolkit` Lego starter snippets).
- **Run Tests**: `npm test`
