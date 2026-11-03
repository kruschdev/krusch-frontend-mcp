# krusch-frontend-mcp — Agent Guidelines & Invariants

> **Role**: Canonical Web Design, Vercel UI Cockpit & Brand Substrate MCP Server  
> **Stack**: Node 22 ESM, Stdio MCP (`@modelcontextprotocol/sdk`), SQLite FTS5 + `sqlite-vec` Hybrid RRF  
> **Last updated**: 2026-11-03

## 1. Architectural Invariants (`MUST` / `MUST NOT`)

1. **INV-01 (Canonical Templates Over Ad-Hoc Boilerplate)**: Public web pages, articles, Vercel Next.js App Router cockpits, and starter modules must retrieve canonical templates via `get_canonical_template({ templateKey })` (`article-shell`, `site-header`, `footer-deadbolt`, `cyber-grid`, `deadbolt-svg`, `nav-back`, `lego-node-api`, `lego-mcp-server`, `lego-sse-route`, `lego-react-shell`, `lego-fastapi-app`, `lego-cloudflare-worker`, `lego-webhook-route`, `lego-vercel-nextjs-shell`, `lego-vercel-edge-sse`, `lego-vercel-json`) rather than inventing ad-hoc HTML shells, SVG marks, or hand-rolled service plumbing.
2. **INV-02 (Deterministic Output & Offline Resilience)**: All template, color-palette (`generate_color_palette`), CSS-to-Tailwind (`css_to_tailwind` with arbitrary-value bracket/brace injection guards), and responsive breakpoint (`generate_responsive_breakpoints`) tools must return deterministic, side-effect-free outputs with zero external network calls. `query_design_rules` uses Hybrid RRF (`sqlite-vec` `1024d` cosine + SQLite `FTS5` `BM25`) and automatically falls back to zero-network `FTS5` lexical search when Ollama embeddings are offline.
3. **INV-03 (MCP Behavioral Annotations)**: Every registered tool must declare explicit `readOnlyHint`, `destructiveHint`, `idempotentHint`, and `openWorldHint` annotations.

## 2. Key Files & Verification
- `src/index.js`: Stdio MCP server registration and canonical template/style tool handlers.
- `src/tools/canonical-templates.js`: Authoritative 16-template registry (6 brand HTML/SVG + 10 `@krusch/toolkit` / `krusch_toolkit` / Vercel Lego starter snippets).
- `src/rag-engine.js`: Hybrid `sqlite-vec` + SQLite `FTS5` (`BM25`) RRF engine over 48 curated design rules (`universal`, `refactoring-ui`, `vercel`).
- **Run Tests**: `npm test`
