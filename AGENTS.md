# krusch-frontend-mcp — Agent Guidelines & Invariants

> **Role**: Canonical Web Design & Brand Substrate MCP Server  
> **Stack**: Node 22 ESM, Stdio MCP (`@modelcontextprotocol/sdk`)  
> **Last updated**: 2026-10-20

## 1. Architectural Invariants (`MUST` / `MUST NOT`)

1. **INV-01 (Canonical Templates Over Ad-Hoc Boilerplate)**: Public web pages and articles (e.g. `krusch-dev-site`) must retrieve canonical templates via `get_canonical_template({ templateKey })` (`article-shell`, `footer-deadbolt`, `cyber-grid`, `deadbolt-svg`, `nav-back`) rather than inventing ad-hoc HTML shells or SVG marks.
2. **INV-02 (Deterministic Output)**: All template, color-palette (`generate_color_palette`), CSS-to-Tailwind (`css_to_tailwind`), and responsive breakpoint (`generate_responsive_breakpoints`) tools must return deterministic, side-effect-free outputs with zero external network calls.
3. **INV-03 (MCP Behavioral Annotations)**: Every registered tool must declare explicit `readOnlyHint`, `destructiveHint`, `idempotentHint`, and `openWorldHint` annotations.

## 2. Key Files & Verification
- `src/index.js`: Stdio MCP server registration and canonical template/style tool handlers.
- **Run Tests**: `npm test`
